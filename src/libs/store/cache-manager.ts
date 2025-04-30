import type { Resource } from '../../mixins/interfaces.ts';
import { isUrlOrRelativePath } from '../helpers.ts';

/**
 * A centralized cache manager for JSON-LD resources.
 *
 * Handles the decoupling between the fetch URL and the resource's internal @id.
 * Allows storing, retrieving, and resolving resources either by their URL or @id.
 */
export class CacheManager {
  private resourceCache: Map<string, Resource> = new Map();
  private urlToIdMap: Map<string, string> = new Map();

  /**
   * Retrieves a cached resource based on the URL it was originally fetched from.
   * Internally resolves the associated @id and returns the corresponding resource.
   *
   * @param url - The original URL used to fetch the resource.
   * @returns The cached resource, or undefined if not found.
   */
  getByUrl(url: string): Resource | undefined {
    const id = this.urlToIdMap.get(url);
    if (!id) return undefined;
    return this.resourceCache.get(id);
  }

  hasUrlMatch(url: string): boolean {
    if (!this.urlToIdMap.get(url)) return false;
    return true;
  }

  /**
   * Retrieves a cached resource by its unique @id.
   *
   * @param id - The @id of the resource (can be a URI, URN, or UUID).
   * @returns The cached resource, or undefined if not found.
   */
  getById(id: string): Resource | undefined {
    return this.resourceCache.get(id);
  }

  /**
   * Retrieves a resource from the cache by either @id or fetch URL.
   * If the input is an ID, returns directly.
   * If it's a URL, attempts to resolve the associated @id first.
   *
   * @param idOrUrl - A resource @id or its original fetch URL.
   * @returns The cached resource, or undefined if not found.
   */
  get(ref: string): Resource | undefined {
    if (this.resourceCache.has(ref)) {
      return this.resourceCache.get(ref);
    }

    const id = this.urlToIdMap.get(ref);
    if (id) {
      return this.resourceCache.get(id);
    }

    return undefined;
  }

  length(): number {
    return this.resourceCache.size;
  }

  /**
   * Stores a resource in the cache and creates a mapping from the given URL to the resource's @id.
   *
   * @param url - The URL from which the resource was fetched.
   * @param resource - The JSON-LD resource to store. Must contain a valid @id.
   */
  set(url: string, resource: Resource): void {
    const id = resource?.['@id'];
    if (!id) {
      console.warn('[CacheManager] Resource has no @id', resource);
      return;
    }

    this.resourceCache.set(id, resource);
    this.urlToIdMap.set(url, id);
  }

  /**
   * Links a data source URL or relative path to a given resource ID (`@id`)
   *
   * Used to establish a lookup path when the resource is first accessed by URL
   * and later by its actual `@id`.
   *
   * @param url - Data source (absolute or relative path).
   * @param emptyResource - The resource to associate with this URL. Must include a valid `@id`.
   */
  linkUrlWithId(url: string, emptyResource: Resource) {
    if (!isUrlOrRelativePath(url)) return;
    if (this.hasUrlMatch(url)) return;

    this.set(url, emptyResource as any);
  }

  /**
   * Checks if a resource is cached.
   * Can be checked either by @id or by the original fetch URL.
   *
   * @param urlOrId - The @id or URL to check for.
   * @returns True if the resource exists in cache, false otherwise.
   */
  has(urlOrId: string): boolean {
    if (this.resourceCache.has(urlOrId)) return true;
    const id = this.urlToIdMap.get(urlOrId);
    return id ? this.resourceCache.has(id) : false;
  }

  /**
   * Returns the @id associated with a given fetch URL.
   *
   * @param url - The original fetch URL.
   * @returns The associated @id, or undefined if no mapping exists.
   */
  getIdByUrl(url: string): string | undefined {
    return this.urlToIdMap.get(url);
  }

  /**
   * Clears the entire cache and all URL-to-ID mappings.
   */
  clear(): void {
    this.resourceCache.clear();
    this.urlToIdMap.clear();
  }

  /**
   * Removes a resource from the cache by @id or original fetch URL.
   * Both the resource and its URL mapping will be removed if applicable.
   *
   * @param idOrUrl - The @id or URL of the resource to delete.
   * @returns True if the resource was found and deleted, false otherwise.
   */
  delete(idOrUrl: string): boolean {
    if (this.resourceCache.has(idOrUrl)) {
      this.resourceCache.delete(idOrUrl);

      for (const [url, id] of this.urlToIdMap.entries()) {
        if (id === idOrUrl) {
          this.urlToIdMap.delete(url);
          break;
        }
      }

      return true;
    }

    const id = this.urlToIdMap.get(idOrUrl);
    if (id && this.resourceCache.has(id)) {
      this.resourceCache.delete(id);
      this.urlToIdMap.delete(idOrUrl);
      return true;
    }

    return false;
  }
}
