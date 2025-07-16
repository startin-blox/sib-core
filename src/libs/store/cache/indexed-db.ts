import type { Resource } from '../../../mixins/interfaces.ts';
import { isUrlOrRelativePath } from '../../helpers.ts';
import type { CacheManagerInterface } from './cache-manager.ts';

/**
 * A centralized cache manager for JSON-LD resources, backed by IndexedDB.
 *
 * Handles the decoupling between the fetch URL and the resource's internal @id.
 * Stores and retrieves resources either by their URL or @id using browser IndexedDB.
 */
export class IndexedDBCacheManager implements CacheManagerInterface {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.openDb();
  }

  // --- INTERNAL HELPERS --------------------------------------------------

  /**
   * Convert a Resource to the stored shape: move '@id' -> 'id'.
   */
  private toStored(resource: Resource): any {
    console.log('[IndexedDB] Converting resource to stored format', resource);
    if (!resource) return resource;
    const { ['@id']: atId, ...rest } = resource;
    const result = this.deepUnwrap({ ...rest, id: atId })
    console.log('[IndexedDB] Converted proxy to :', result);
    return result;
  }

  /**
   * Recursively unwraps an object, converting it to a plain object.
   * This is useful for removing any non-cloneable properties like DOM nodes,
   * functions, or other complex types that cannot be stored in IndexedDB.
   * @param obj 
   * @returns 
   */
  private deepUnwrap(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(this.deepUnwrap);
    }

    const plain: any = {};
    for (const key of Reflect.ownKeys(obj)) {
      const value = obj[key as keyof typeof obj];
      try {
        plain[key] = this.deepUnwrap(value);
      } catch {
        // Ignore non-cloneable values like DOM nodes, symbols, etc.
      }
    }

    return plain;
  }

  /**
   * Convert stored record back to Resource: move 'id' -> '@id'.
   */
  private toResource(stored: any): Resource {
    if (!stored) return stored;
    const { id, ...rest } = stored;
    return { '@id': id, ...rest };
  }

  /**
   * Opens (or creates) the IndexedDB database and object stores.
   */
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CacheManagerDB', 1);
      console.log('[CacheManager] Opening IndexedDB', request);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('resources')) {
          // Store JSON-LD resources under keyPath "@id"
          db.createObjectStore('resources', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('urlToId')) {
          // Store URL-to-@id mappings under keyPath "url"
          db.createObjectStore('urlToId', { keyPath: 'url' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Retrieves a cached resource based on its URL.
   *
   * @param id - The @id of the resource (URI, URN, or UUID).
   * @returns A Promise that resolves to the Resource, or undefined if not found.
   */
  async getByUrl(url: string): Promise<Resource | undefined> {
    const db = await this.dbPromise;
    console.log('[CacheManager] Getting resource by URL', url, db);
    return new Promise((resolve, reject) => {
      const tx = db.transaction('urlToId', 'readonly');
      const store = tx.objectStore('urlToId');
      const req = store.get(url);
      req.onsuccess = () => {
        const mapping = req.result as { url: string; id: string } | undefined;
        if (!mapping) return resolve(undefined);
        const resTx = db.transaction('resources', 'readonly');
        const resStore = resTx.objectStore('resources');
        const getRes = resStore.get(mapping.id);
        getRes.onsuccess = () =>
          resolve(this.toResource(getRes.result as Resource | undefined));
        getRes.onerror = () => reject(getRes.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves a cached resource based on its @id.
   *
   * @param id - The @id of the resource (URI, URN, or UUID).
   * @returns A Promise that resolves to the Resource, or undefined if not found.
   */
  async getById(id: string): Promise<Resource | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('resources', 'readonly');
      const store = tx.objectStore('resources');
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(this.toResource(request.result as Resource | undefined));
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Retrieves a resource from the cache by either its @id or original fetch URL.
   * If the input is an @id, returns the resource directly.
   * If it's a URL, resolves the associated @id and returns the corresponding resource.
   *
   * @param ref - A resource @id or its original fetch URL.
   * @returns A Promise that resolves to the Resource, or undefined if not found.
   */
  async get(ref: string): Promise<Resource | undefined> {
    const db = await this.dbPromise;
    console.log('[CacheManager] Getting resource by REF', ref, db);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['resources', 'urlToId'], 'readonly');
      const resourcesStore = tx.objectStore('resources');
      const urlToIdStore = tx.objectStore('urlToId');

      // First, try to get by id directly
      const getResourceReq = resourcesStore.get(ref);
      getResourceReq.onsuccess = () => {
        const resource = getResourceReq.result as Resource | undefined;
        if (resource) {
          resolve(resource);
        } else {
          // If not found by id, try resolving ref as a URL
          const getIdReq = urlToIdStore.get(ref);
          getIdReq.onsuccess = () => {
            const mapping = getIdReq.result as
              | { url: string; id: string }
              | undefined;
            if (mapping) {
              const getByIdReq = resourcesStore.get(mapping.id);
              getByIdReq.onsuccess = () => {
                resolve(getByIdReq.result as Resource | undefined);
              };
              getByIdReq.onerror = () => {
                reject(getByIdReq.error);
              };
            } else {
              resolve(undefined);
            }
          };
          getIdReq.onerror = () => {
            reject(getIdReq.error);
          };
        }
      };
      getResourceReq.onerror = () => {
        reject(getResourceReq.error);
      };
    });
  }

  /**
   * Returns the number of resources currently stored in IndexedDB.
   *
   * @returns A Promise that resolves to the count of cached resources.
   */
  async length(): Promise<number> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('resources', 'readonly');
      const store = tx.objectStore('resources');
      const countReq = store.count();
      countReq.onsuccess = () => {
        resolve(countReq.result);
      };
      countReq.onerror = () => {
        reject(countReq.error);
      };
    });
  }

  /**
   * Stores a JSON-LD resource in the cache and creates a mapping
   * from the given URL to the resource's @id.
   *
   * @param url - The URL from which the resource was fetched.
   * @param resource - The JSON-LD resource to store. Must contain a valid `@id`.
   */
  async set(url: string, resource: Resource): Promise<void> {
    const id = resource['@id'];
    if (!id) {
      console.warn('[CacheManager] Resource has no @id', resource);
      return;
    }

    const db = await this.dbPromise;
    return new Promise(async (resolve, reject) => {
      const tx = db.transaction(['resources', 'urlToId'], 'readwrite');
      const resourcesStore = tx.objectStore('resources');
      const urlToIdStore = tx.objectStore('urlToId');

      // Put the resource under its @id
      console.log('[IndexedDB] Storing resource', this.toStored(await resource));
      const putResReq = resourcesStore.put(this.toStored(await resource));
      putResReq.onerror = () => {
        reject(putResReq.error);
      };

      // Put the URL → @id mapping
      const putMapReq = urlToIdStore.put({ url, id });
      putMapReq.onerror = () => {
        reject(putMapReq.error);
      };

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error);
      };
    });
  }

  /**
   * Links a data source URL or relative path to a given resource ID (`@id`).
   * Only establishes the mapping if the URL is valid and not already in cache.
   *
   * @param url - Data source (absolute or relative path).
   * @param emptyResource - The resource to associate with this URL. Must include a valid `@id`.
   */
  async linkUrlWithId(url: string, emptyResource: Resource): Promise<void> {
    if (!isUrlOrRelativePath(url)) return;
    const existingId = await this.getIdByUrl(url);
    if (existingId) return;
    await this.set(url, emptyResource);
  }

  /**
   * Checks if a resource exists in the cache by @id or fetch URL.
   *
   * @param urlOrId - The @id or URL of the resource.
   * @returns A Promise that resolves to true if the resource exists, false otherwise.
   */
  async has(urlOrId: string): Promise<boolean> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['resources', 'urlToId'], 'readonly');
      const resourcesStore = tx.objectStore('resources');
      const urlToIdStore = tx.objectStore('urlToId');

      // First, check if it exists as an @id
      const getResReq = resourcesStore.get(urlOrId);
      getResReq.onsuccess = () => {
        if (getResReq.result) {
          resolve(true);
        } else {
          // Otherwise, try to resolve as a URL
          const getIdReq = urlToIdStore.get(urlOrId);
          getIdReq.onsuccess = () => {
            const mapping = getIdReq.result as
              | { url: string; id: string }
              | undefined;
            if (mapping) {
              const getByIdReq = resourcesStore.get(mapping.id);
              getByIdReq.onsuccess = () => {
                resolve(!!getByIdReq.result);
              };
              getByIdReq.onerror = () => {
                reject(getByIdReq.error);
              };
            } else {
              resolve(false);
            }
          };
          getIdReq.onerror = () => {
            reject(getIdReq.error);
          };
        }
      };
      getResReq.onerror = () => {
        reject(getResReq.error);
      };
    });
  }

  /**
   * Returns the @id associated with a given fetch URL.
   *
   * @param url - The original fetch URL.
   * @returns A Promise that resolves to the associated @id, or undefined if no mapping exists.
   */
  async getIdByUrl(url: string): Promise<string | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('urlToId', 'readonly');
      const store = tx.objectStore('urlToId');
      const request = store.get(url);
      request.onsuccess = () => {
        const result = request.result as
          | { url: string; id: string }
          | undefined;
        resolve(result ? result.id : undefined);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clears the entire cache and all URL-to-ID mappings.
   */
  async clear(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['resources', 'urlToId'], 'readwrite');
      tx.objectStore('resources').clear();
      tx.objectStore('urlToId').clear();
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error);
      };
    });
  }

  /**
   * Removes a resource from the cache by @id or original fetch URL.
   * Both the resource record and its URL mapping (if applicable) will be removed.
   *
   * @param idOrUrl - The @id or URL of the resource to delete.
   * @returns A Promise that resolves to true if the resource was found and deleted, false otherwise.
   */
  async delete(idOrUrl: string): Promise<boolean> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['resources', 'urlToId'], 'readwrite');
      const resourcesStore = tx.objectStore('resources');
      const urlToIdStore = tx.objectStore('urlToId');

      // First, check if idOrUrl is an @id in the resources store
      const getByIdReq = resourcesStore.get(idOrUrl);
      getByIdReq.onsuccess = () => {
        const resource = getByIdReq.result as Resource | undefined;
        if (resource) {
          // Delete by @id
          resourcesStore.delete(idOrUrl);
          // Also attempt to delete any URL key that exactly matches idOrUrl
          urlToIdStore.delete(idOrUrl);
          tx.oncomplete = () => resolve(true);
        } else {
          // Otherwise, treat idOrUrl as a URL and see if there's a mapping
          const getIdReq = urlToIdStore.get(idOrUrl);
          getIdReq.onsuccess = () => {
            const mapping = getIdReq.result as
              | { url: string; id: string }
              | undefined;
            if (mapping) {
              resourcesStore.delete(mapping.id);
              urlToIdStore.delete(idOrUrl);
              tx.oncomplete = () => resolve(true);
            } else {
              resolve(false);
            }
          };
          getIdReq.onerror = () => {
            reject(getIdReq.error);
          };
        }
      };
      getByIdReq.onerror = () => {
        reject(getByIdReq.error);
      };
    });
  }
}
