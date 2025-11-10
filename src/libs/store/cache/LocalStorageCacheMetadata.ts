/**
 * LocalStorageCacheManager
 *
 * Manages complete cache (data + metadata) in localStorage for federated catalog offerings.
 * Tracks cache state, timestamps, hashes, and stores full resource data.
 */

export interface CacheData {
  version: string;
  lastFetchTimestamp: number;
  cacheExpirationTimestamp: number;
  resource: any; // The full ldp:contains resource
  items: Map<string, CacheItemMetadata>;
}

export interface CacheItemMetadata {
  sdHash: string;
  uploadDatetime: string;
  statusDatetime: string;
  cachedAt: number;
  resourceId: string; // @id of the mapped resource for easy lookup
}

export class LocalStorageCacheMetadataManager {
  private static readonly STORAGE_KEY_PREFIX = 'fc-cache-data';
  private static readonly CACHE_VERSION = '2.0.0'; // Bumped for full data storage
  private static readonly DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

  constructor(
    private endpoint: string,
    private ttlMs: number = LocalStorageCacheMetadataManager.DEFAULT_TTL_MS,
  ) {
    // Clean up old cache format (v1.0.0 with different key prefix)
    this.cleanupOldCacheFormat();
  }

  /**
   * Remove old cache format from previous version
   */
  private cleanupOldCacheFormat(): void {
    try {
      const endpointHash = this.endpoint.replace(/[^a-zA-Z0-9]/g, '');
      const oldKey = `fc-cache-meta-${endpointHash}`;

      if (localStorage.getItem(oldKey)) {
        localStorage.removeItem(oldKey);
      }
    } catch (error) {
      console.warn(
        '[LocalStorageCache] Error cleaning up old cache format:',
        error,
      );
    }
  }

  /**
   * Get the localStorage key for this endpoint
   */
  private getStorageKey(): string {
    const endpointHash = this.endpoint.replace(/[^a-zA-Z0-9]/g, '');
    return `${LocalStorageCacheMetadataManager.STORAGE_KEY_PREFIX}-${endpointHash}`;
  }

  /**
   * Get cache data from localStorage (includes full resource + metadata)
   */
  getCacheData(): CacheData | null {
    try {
      const key = this.getStorageKey();
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);

      // Convert items object back to Map
      const items = new Map<string, CacheItemMetadata>();
      if (parsed.items) {
        for (const [hash, metadata] of Object.entries(parsed.items)) {
          items.set(hash, metadata as CacheItemMetadata);
        }
      }

      return {
        version: parsed.version,
        lastFetchTimestamp: parsed.lastFetchTimestamp,
        cacheExpirationTimestamp: parsed.cacheExpirationTimestamp,
        resource: parsed.resource,
        items,
      };
    } catch (error) {
      console.error('[LocalStorageCache] Error reading cache data:', error);
      return null;
    }
  }

  /**
   * Alias for backward compatibility
   */
  getCacheMetadata(): CacheData | null {
    return this.getCacheData();
  }

  /**
   * Set cache data in localStorage (includes full resource + metadata)
   */
  setCacheData(cacheData: CacheData): boolean {
    try {
      const key = this.getStorageKey();

      // Convert Map to object for JSON serialization
      const itemsObj: Record<string, CacheItemMetadata> = {};
      cacheData.items.forEach((value, hash) => {
        itemsObj[hash] = value;
      });

      const data = JSON.stringify({
        version: cacheData.version,
        lastFetchTimestamp: cacheData.lastFetchTimestamp,
        cacheExpirationTimestamp: cacheData.cacheExpirationTimestamp,
        resource: cacheData.resource,
        items: itemsObj,
      });

      localStorage.setItem(key, data);
      return true;
    } catch (error) {
      // localStorage quota exceeded or other error
      console.error('[LocalStorageCache] Error writing cache data:', error);
      return false;
    }
  }

  /**
   * Alias for backward compatibility
   */
  setCacheMetadata(cacheData: CacheData): boolean {
    return this.setCacheData(cacheData);
  }

  /**
   * Check if cache is valid (within TTL and not expired)
   */
  isCacheValid(): boolean {
    const cacheData = this.getCacheData();

    if (!cacheData) {
      return false;
    }

    // Check version compatibility
    if (cacheData.version !== LocalStorageCacheMetadataManager.CACHE_VERSION) {
      console.log('[LocalStorageCache] Cache version mismatch, invalidating');
      return false;
    }

    // Check if cache has expired
    const now = Date.now();
    if (now > cacheData.cacheExpirationTimestamp) {
      console.log('[LocalStorageCache] Cache TTL expired');
      return false;
    }

    return true;
  }

  /**
   * Get the cached resource (ldp:contains array)
   */
  getResource(): any | null {
    const cacheData = this.getCacheData();
    return cacheData?.resource || null;
  }

  /**
   * Get set of known sdHashes
   */
  getKnownHashes(): Set<string> {
    const cacheData = this.getCacheData();

    if (!cacheData) {
      return new Set();
    }

    return new Set(cacheData.items.keys());
  }

  /**
   * Get metadata for a specific item
   */
  getItemMetadata(sdHash: string): CacheItemMetadata | null {
    const cacheData = this.getCacheData();

    if (!cacheData) {
      return null;
    }

    return cacheData.items.get(sdHash) || null;
  }

  /**
   * Update cache with new resource and items
   */
  updateCache(resource: any, items: CacheItemMetadata[]): boolean {
    const now = Date.now();
    let cacheData = this.getCacheData();

    if (!cacheData || !this.isCacheValid()) {
      // Create new cache
      cacheData = {
        version: LocalStorageCacheMetadataManager.CACHE_VERSION,
        lastFetchTimestamp: now,
        cacheExpirationTimestamp: now + this.ttlMs,
        resource: resource,
        items: new Map(),
      };
    } else {
      // Update existing cache with new resource
      cacheData.resource = resource;
    }

    // Update items
    for (const item of items) {
      cacheData.items.set(item.sdHash, {
        ...item,
        cachedAt: now,
      });
    }

    // Update timestamp
    cacheData.lastFetchTimestamp = now;

    return this.setCacheData(cacheData);
  }

  /**
   * Remove items from cache and update resource
   */
  removeItems(sdHashes: string[]): boolean {
    const cacheData = this.getCacheData();

    if (!cacheData) {
      return false;
    }

    // Remove from metadata
    for (const hash of sdHashes) {
      cacheData.items.delete(hash);
    }

    // Remove from resource by matching resourceId
    if (cacheData.resource?.['ldp:contains']) {
      const resourceIdsToRemove = new Set<string>();
      for (const hash of sdHashes) {
        const meta = cacheData.items.get(hash);
        if (meta) {
          resourceIdsToRemove.add(meta.resourceId);
        }
      }

      cacheData.resource['ldp:contains'] = cacheData.resource[
        'ldp:contains'
      ].filter((item: any) => !resourceIdsToRemove.has(item['@id']));
    }

    return this.setCacheData(cacheData);
  }

  /**
   * Clear all cache data
   */
  clear(): boolean {
    try {
      const key = this.getStorageKey();
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('[LocalStorageCache] Error clearing cache data:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    itemCount: number;
    lastFetch: Date | null;
    expiresAt: Date | null;
    isValid: boolean;
  } {
    const cacheData = this.getCacheData();

    if (!cacheData) {
      return {
        itemCount: 0,
        lastFetch: null,
        expiresAt: null,
        isValid: false,
      };
    }

    return {
      itemCount: cacheData.items.size,
      lastFetch: new Date(cacheData.lastFetchTimestamp),
      expiresAt: new Date(cacheData.cacheExpirationTimestamp),
      isValid: this.isCacheValid(),
    };
  }
}
