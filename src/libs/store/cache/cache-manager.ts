import type { Resource } from '../shared/types.ts';

export interface CacheManagerInterface {
  /**
   * Look up a resource by the URL it was fetched from.
   * Returns `undefined` if not in cache.
   */
  getByUrl(url: string): Promise<Resource | undefined>;

  /**
   * Look up a resource by its @id.
   * Returns `undefined` if not in cache.
   */
  getById(id: string): Promise<Resource | undefined>;

  /**
   * Try to resolve either an @id or a URL → @id → Resource lookup.
   * If `ref` is an @id, returns it directly; if it’s a URL, first finds the @id
   * then returns the Resource.
   */
  get(ref: string): Promise<Resource | undefined>;

  /**
   * Store a Resource under the given fetch‐URL.
   * The implementer must also record URL→@id internally so that future
   * lookups by URL work.
   */
  set(url: string, resource: Resource): Promise<void>;

  /**
   * “Link” a URL to a Resource that already has an @id, without re‐writing
   * the Resource itself. (Only does anything if `isUrlOrRelativePath(url)`.)
   */
  linkUrlWithId(url: string, emptyResource: Resource): Promise<void>;

  /**
   * Check for existence by @id or by URL.
   * Returns `true` if present, `false` otherwise.
   */
  has(ref: string): Promise<boolean>;

  /**
   * If you gave us a URL earlier, get back its @id; else `undefined`.
   */
  getIdByUrl(url: string): Promise<string | undefined>;

  /**
   * “How many Resources are in the cache right now?”
   */
  length(): Promise<number>;

  /**
   * Blow away every Resource **and** every URL→@id mapping.
   */
  clear(): Promise<void>;

  /**
   * Delete by @id or by URL.
   * Returns `true` if something was actually removed, `false` otherwise.
   */
  delete(idOrUrl: string): Promise<boolean>;
}
