import {
  LocalStorageCacheMetadataManager,
  type CacheMetadata,
  type CacheItemMetadata,
} from '../../../src/libs/cache/LocalStorageCacheMetadata.ts';

describe('LocalStorageCacheMetadataManager', () => {
  let manager: LocalStorageCacheMetadataManager;
  const testEndpoint = 'https://api.example.com/fc';
  const testTTL = 2 * 60 * 60 * 1000; // 2 hours

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    manager = new LocalStorageCacheMetadataManager(testEndpoint, testTTL);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Constructor', () => {
    it('creates instance with endpoint and default TTL', () => {
      const mgr = new LocalStorageCacheMetadataManager(testEndpoint);
      expect(mgr).to.exist;
    });

    it('creates instance with custom TTL', () => {
      const customTTL = 1000;
      const mgr = new LocalStorageCacheMetadataManager(testEndpoint, customTTL);
      expect(mgr).to.exist;
    });
  });

  describe('getStorageKey', () => {
    it('generates consistent key for same endpoint', () => {
      const mgr1 = new LocalStorageCacheMetadataManager(testEndpoint);
      const mgr2 = new LocalStorageCacheMetadataManager(testEndpoint);

      // Both should produce same storage key (tested indirectly)
      mgr1.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const metadata = mgr2.getCacheMetadata();
      expect(metadata).to.exist;
      expect(metadata?.items.size).to.equal(1);
    });

    it('generates different keys for different endpoints', () => {
      const mgr1 = new LocalStorageCacheMetadataManager('https://api1.com');
      const mgr2 = new LocalStorageCacheMetadataManager('https://api2.com');

      mgr1.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const metadata2 = mgr2.getCacheMetadata();
      expect(metadata2).to.be.null;
    });
  });

  describe('getCacheMetadata', () => {
    it('returns null when no cache exists', () => {
      const metadata = manager.getCacheMetadata();
      expect(metadata).to.be.null;
    });

    it('retrieves existing cache metadata', () => {
      const testItem: CacheItemMetadata = {
        sdHash: 'test-hash-1',
        uploadDatetime: '2024-01-01T00:00:00Z',
        statusDatetime: '2024-01-01T00:00:00Z',
        cachedAt: Date.now(),
      };

      manager.updateCache([testItem]);

      const metadata = manager.getCacheMetadata();
      expect(metadata).to.exist;
      expect(metadata?.items.size).to.equal(1);
      expect(metadata?.items.get('test-hash-1')).to.deep.include({
        sdHash: 'test-hash-1',
        uploadDatetime: '2024-01-01T00:00:00Z',
        statusDatetime: '2024-01-01T00:00:00Z',
      });
    });

    it('converts items object to Map correctly', () => {
      const testItems: CacheItemMetadata[] = [
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
        {
          sdHash: 'hash2',
          uploadDatetime: '2024-01-02T00:00:00Z',
          statusDatetime: '2024-01-02T00:00:00Z',
          cachedAt: Date.now(),
        },
      ];

      manager.updateCache(testItems);

      const metadata = manager.getCacheMetadata();
      expect(metadata?.items).to.be.instanceOf(Map);
      expect(metadata?.items.size).to.equal(2);
      expect(metadata?.items.has('hash1')).to.be.true;
      expect(metadata?.items.has('hash2')).to.be.true;
    });

    it('handles corrupted JSON gracefully', () => {
      const key = (manager as any).getStorageKey();
      localStorage.setItem(key, 'invalid-json{');

      const metadata = manager.getCacheMetadata();
      expect(metadata).to.be.null;
    });

    it('handles missing items field', () => {
      const key = (manager as any).getStorageKey();
      const corruptedData = {
        version: '1.0.0',
        lastFetchTimestamp: Date.now(),
        cacheExpirationTimestamp: Date.now() + 1000,
        // items field is missing
      };
      localStorage.setItem(key, JSON.stringify(corruptedData));

      const metadata = manager.getCacheMetadata();
      expect(metadata).to.exist;
      expect(metadata?.items.size).to.equal(0);
    });
  });

  describe('setCacheMetadata', () => {
    it('stores cache metadata successfully', () => {
      const now = Date.now();
      const testMetadata: CacheMetadata = {
        version: '1.0.0',
        lastFetchTimestamp: now,
        cacheExpirationTimestamp: now + testTTL,
        items: new Map([
          [
            'hash1',
            {
              sdHash: 'hash1',
              uploadDatetime: '2024-01-01T00:00:00Z',
              statusDatetime: '2024-01-01T00:00:00Z',
              cachedAt: now,
            },
          ],
        ]),
      };

      const success = manager.setCacheMetadata(testMetadata);
      expect(success).to.be.true;

      const retrieved = manager.getCacheMetadata();
      expect(retrieved).to.exist;
      expect(retrieved?.version).to.equal('1.0.0');
      expect(retrieved?.items.size).to.equal(1);
    });

    it('converts Map to object for JSON serialization', () => {
      const now = Date.now();
      const items = new Map<string, CacheItemMetadata>([
        [
          'hash1',
          {
            sdHash: 'hash1',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: now,
          },
        ],
        [
          'hash2',
          {
            sdHash: 'hash2',
            uploadDatetime: '2024-01-02T00:00:00Z',
            statusDatetime: '2024-01-02T00:00:00Z',
            cachedAt: now,
          },
        ],
      ]);

      const metadata: CacheMetadata = {
        version: '1.0.0',
        lastFetchTimestamp: now,
        cacheExpirationTimestamp: now + testTTL,
        items,
      };

      manager.setCacheMetadata(metadata);

      // Check that localStorage has proper JSON
      const key = (manager as any).getStorageKey();
      const storedJson = localStorage.getItem(key);
      expect(storedJson).to.exist;

      const parsed = JSON.parse(storedJson!);
      expect(parsed.items).to.be.an('object');
      expect(parsed.items.hash1).to.exist;
      expect(parsed.items.hash2).to.exist;
    });

    it('handles localStorage quota exceeded error', () => {
      // Create a large metadata that exceeds quota
      const items = new Map<string, CacheItemMetadata>();

      // Stub localStorage.setItem to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      cy.stub(localStorage, 'setItem').callsFake(() => {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      });

      const metadata: CacheMetadata = {
        version: '1.0.0',
        lastFetchTimestamp: Date.now(),
        cacheExpirationTimestamp: Date.now() + testTTL,
        items,
      };

      const success = manager.setCacheMetadata(metadata);
      expect(success).to.be.false;

      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });

  describe('isCacheValid', () => {
    it('returns false when no cache exists', () => {
      expect(manager.isCacheValid()).to.be.false;
    });

    it('returns true for valid cache within TTL', () => {
      const now = Date.now();
      const metadata: CacheMetadata = {
        version: '1.0.0',
        lastFetchTimestamp: now,
        cacheExpirationTimestamp: now + testTTL,
        items: new Map(),
      };

      manager.setCacheMetadata(metadata);
      expect(manager.isCacheValid()).to.be.true;
    });

    it('returns false for expired cache', () => {
      const now = Date.now();
      const metadata: CacheMetadata = {
        version: '1.0.0',
        lastFetchTimestamp: now - testTTL * 2,
        cacheExpirationTimestamp: now - 1000, // Expired 1 second ago
        items: new Map(),
      };

      manager.setCacheMetadata(metadata);
      expect(manager.isCacheValid()).to.be.false;
    });

    it('returns false for cache version mismatch', () => {
      const now = Date.now();
      const metadata: CacheMetadata = {
        version: '0.9.0', // Old version
        lastFetchTimestamp: now,
        cacheExpirationTimestamp: now + testTTL,
        items: new Map(),
      };

      manager.setCacheMetadata(metadata);
      expect(manager.isCacheValid()).to.be.false;
    });

    it('validates cache at exact expiration boundary', () => {
      const now = Date.now();
      const metadata: CacheMetadata = {
        version: '1.0.0',
        lastFetchTimestamp: now,
        cacheExpirationTimestamp: now, // Expires exactly now
        items: new Map(),
      };

      manager.setCacheMetadata(metadata);

      // At the exact boundary, cache should be invalid (now > expiration is false)
      // But in reality, by the time we check, time has moved forward slightly
      cy.wait(1).then(() => {
        expect(manager.isCacheValid()).to.be.false;
      });
    });
  });

  describe('getKnownHashes', () => {
    it('returns empty set when no cache exists', () => {
      const hashes = manager.getKnownHashes();
      expect(hashes).to.be.instanceOf(Set);
      expect(hashes.size).to.equal(0);
    });

    it('returns all cached hashes', () => {
      const testItems: CacheItemMetadata[] = [
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
        {
          sdHash: 'hash2',
          uploadDatetime: '2024-01-02T00:00:00Z',
          statusDatetime: '2024-01-02T00:00:00Z',
          cachedAt: Date.now(),
        },
        {
          sdHash: 'hash3',
          uploadDatetime: '2024-01-03T00:00:00Z',
          statusDatetime: '2024-01-03T00:00:00Z',
          cachedAt: Date.now(),
        },
      ];

      manager.updateCache(testItems);

      const hashes = manager.getKnownHashes();
      expect(hashes.size).to.equal(3);
      expect(hashes.has('hash1')).to.be.true;
      expect(hashes.has('hash2')).to.be.true;
      expect(hashes.has('hash3')).to.be.true;
    });
  });

  describe('getItemMetadata', () => {
    it('returns null when cache does not exist', () => {
      const item = manager.getItemMetadata('nonexistent');
      expect(item).to.be.null;
    });

    it('returns null when item does not exist', () => {
      manager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const item = manager.getItemMetadata('nonexistent');
      expect(item).to.be.null;
    });

    it('returns existing item metadata', () => {
      const testItem: CacheItemMetadata = {
        sdHash: 'hash1',
        uploadDatetime: '2024-01-01T00:00:00Z',
        statusDatetime: '2024-01-01T00:00:00Z',
        cachedAt: Date.now(),
      };

      manager.updateCache([testItem]);

      const item = manager.getItemMetadata('hash1');
      expect(item).to.exist;
      expect(item?.sdHash).to.equal('hash1');
      expect(item?.uploadDatetime).to.equal('2024-01-01T00:00:00Z');
      expect(item?.statusDatetime).to.equal('2024-01-01T00:00:00Z');
    });
  });

  describe('updateCache', () => {
    it('creates new cache when none exists', () => {
      const testItems: CacheItemMetadata[] = [
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ];

      const success = manager.updateCache(testItems);
      expect(success).to.be.true;

      const metadata = manager.getCacheMetadata();
      expect(metadata).to.exist;
      expect(metadata?.items.size).to.equal(1);
      expect(metadata?.version).to.equal('1.0.0');
    });

    it('adds new items to existing cache', () => {
      manager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      manager.updateCache([
        {
          sdHash: 'hash2',
          uploadDatetime: '2024-01-02T00:00:00Z',
          statusDatetime: '2024-01-02T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const metadata = manager.getCacheMetadata();
      expect(metadata?.items.size).to.equal(2);
      expect(metadata?.items.has('hash1')).to.be.true;
      expect(metadata?.items.has('hash2')).to.be.true;
    });

    it('updates existing items', () => {
      const now = Date.now();

      manager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: now,
        },
      ]);

      cy.wait(10).then(() => {
        const laterTime = Date.now();
        manager.updateCache([
          {
            sdHash: 'hash1',
            uploadDatetime: '2024-01-02T00:00:00Z', // Updated
            statusDatetime: '2024-01-02T00:00:00Z', // Updated
            cachedAt: laterTime,
          },
        ]);

        const item = manager.getItemMetadata('hash1');
        expect(item?.uploadDatetime).to.equal('2024-01-02T00:00:00Z');
        expect(item?.statusDatetime).to.equal('2024-01-02T00:00:00Z');
        expect(item?.cachedAt).to.be.greaterThan(now);
      });
    });

    it('updates lastFetchTimestamp', () => {
      const before = Date.now();

      manager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const metadata = manager.getCacheMetadata();
      expect(metadata?.lastFetchTimestamp).to.be.at.least(before);
    });

    it('recreates cache when expired', () => {
      const now = Date.now();
      const expiredMetadata: CacheMetadata = {
        version: '1.0.0',
        lastFetchTimestamp: now - testTTL * 2,
        cacheExpirationTimestamp: now - 1000, // Expired
        items: new Map([
          [
            'old-hash',
            {
              sdHash: 'old-hash',
              uploadDatetime: '2024-01-01T00:00:00Z',
              statusDatetime: '2024-01-01T00:00:00Z',
              cachedAt: now - testTTL * 2,
            },
          ],
        ]),
      };

      manager.setCacheMetadata(expiredMetadata);

      manager.updateCache([
        {
          sdHash: 'new-hash',
          uploadDatetime: '2024-02-01T00:00:00Z',
          statusDatetime: '2024-02-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const metadata = manager.getCacheMetadata();
      expect(metadata?.items.size).to.equal(1);
      expect(metadata?.items.has('new-hash')).to.be.true;
      expect(metadata?.items.has('old-hash')).to.be.false;
    });

    it('sets cachedAt timestamp for all items', () => {
      const before = Date.now();

      manager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: 0, // Should be overwritten
        },
        {
          sdHash: 'hash2',
          uploadDatetime: '2024-01-02T00:00:00Z',
          statusDatetime: '2024-01-02T00:00:00Z',
          cachedAt: 0, // Should be overwritten
        },
      ]);

      const item1 = manager.getItemMetadata('hash1');
      const item2 = manager.getItemMetadata('hash2');

      expect(item1?.cachedAt).to.be.at.least(before);
      expect(item2?.cachedAt).to.be.at.least(before);
    });
  });

  describe('removeItems', () => {
    beforeEach(() => {
      manager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
        {
          sdHash: 'hash2',
          uploadDatetime: '2024-01-02T00:00:00Z',
          statusDatetime: '2024-01-02T00:00:00Z',
          cachedAt: Date.now(),
        },
        {
          sdHash: 'hash3',
          uploadDatetime: '2024-01-03T00:00:00Z',
          statusDatetime: '2024-01-03T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);
    });

    it('returns false when no cache exists', () => {
      localStorage.clear();
      const success = manager.removeItems(['hash1']);
      expect(success).to.be.false;
    });

    it('removes single item', () => {
      const success = manager.removeItems(['hash1']);
      expect(success).to.be.true;

      const metadata = manager.getCacheMetadata();
      expect(metadata?.items.size).to.equal(2);
      expect(metadata?.items.has('hash1')).to.be.false;
      expect(metadata?.items.has('hash2')).to.be.true;
      expect(metadata?.items.has('hash3')).to.be.true;
    });

    it('removes multiple items', () => {
      const success = manager.removeItems(['hash1', 'hash3']);
      expect(success).to.be.true;

      const metadata = manager.getCacheMetadata();
      expect(metadata?.items.size).to.equal(1);
      expect(metadata?.items.has('hash1')).to.be.false;
      expect(metadata?.items.has('hash2')).to.be.true;
      expect(metadata?.items.has('hash3')).to.be.false;
    });

    it('handles removal of non-existent items gracefully', () => {
      const success = manager.removeItems(['nonexistent']);
      expect(success).to.be.true;

      const metadata = manager.getCacheMetadata();
      expect(metadata?.items.size).to.equal(3);
    });

    it('removes all items', () => {
      const success = manager.removeItems(['hash1', 'hash2', 'hash3']);
      expect(success).to.be.true;

      const metadata = manager.getCacheMetadata();
      expect(metadata?.items.size).to.equal(0);
    });
  });

  describe('clear', () => {
    it('removes cache metadata from localStorage', () => {
      manager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      expect(manager.getCacheMetadata()).to.exist;

      const success = manager.clear();
      expect(success).to.be.true;

      expect(manager.getCacheMetadata()).to.be.null;
    });

    it('succeeds when no cache exists', () => {
      const success = manager.clear();
      expect(success).to.be.true;
    });

    it('handles localStorage error gracefully', () => {
      const originalRemoveItem = localStorage.removeItem;
      cy.stub(localStorage, 'removeItem').throws(new Error('Storage error'));

      const success = manager.clear();
      expect(success).to.be.false;

      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('getCacheStats', () => {
    it('returns empty stats when no cache exists', () => {
      const stats = manager.getCacheStats();

      expect(stats.itemCount).to.equal(0);
      expect(stats.lastFetch).to.be.null;
      expect(stats.expiresAt).to.be.null;
      expect(stats.isValid).to.be.false;
    });

    it('returns correct stats for valid cache', () => {
      const now = Date.now();
      const expiresAt = now + testTTL;

      const metadata: CacheMetadata = {
        version: '1.0.0',
        lastFetchTimestamp: now,
        cacheExpirationTimestamp: expiresAt,
        items: new Map([
          [
            'hash1',
            {
              sdHash: 'hash1',
              uploadDatetime: '2024-01-01T00:00:00Z',
              statusDatetime: '2024-01-01T00:00:00Z',
              cachedAt: now,
            },
          ],
          [
            'hash2',
            {
              sdHash: 'hash2',
              uploadDatetime: '2024-01-02T00:00:00Z',
              statusDatetime: '2024-01-02T00:00:00Z',
              cachedAt: now,
            },
          ],
        ]),
      };

      manager.setCacheMetadata(metadata);

      const stats = manager.getCacheStats();

      expect(stats.itemCount).to.equal(2);
      expect(stats.lastFetch).to.be.instanceOf(Date);
      expect(stats.lastFetch?.getTime()).to.equal(now);
      expect(stats.expiresAt).to.be.instanceOf(Date);
      expect(stats.expiresAt?.getTime()).to.equal(expiresAt);
      expect(stats.isValid).to.be.true;
    });

    it('returns correct stats for expired cache', () => {
      const now = Date.now();
      const expiredAt = now - 1000;

      const metadata: CacheMetadata = {
        version: '1.0.0',
        lastFetchTimestamp: now - testTTL * 2,
        cacheExpirationTimestamp: expiredAt,
        items: new Map([
          [
            'hash1',
            {
              sdHash: 'hash1',
              uploadDatetime: '2024-01-01T00:00:00Z',
              statusDatetime: '2024-01-01T00:00:00Z',
              cachedAt: now - testTTL * 2,
            },
          ],
        ]),
      };

      manager.setCacheMetadata(metadata);

      const stats = manager.getCacheStats();

      expect(stats.itemCount).to.equal(1);
      expect(stats.lastFetch).to.be.instanceOf(Date);
      expect(stats.expiresAt).to.be.instanceOf(Date);
      expect(stats.isValid).to.be.false;
    });

    it('tracks item count accurately', () => {
      manager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      expect(manager.getCacheStats().itemCount).to.equal(1);

      manager.updateCache([
        {
          sdHash: 'hash2',
          uploadDatetime: '2024-01-02T00:00:00Z',
          statusDatetime: '2024-01-02T00:00:00Z',
          cachedAt: Date.now(),
        },
        {
          sdHash: 'hash3',
          uploadDatetime: '2024-01-03T00:00:00Z',
          statusDatetime: '2024-01-03T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      expect(manager.getCacheStats().itemCount).to.equal(3);

      manager.removeItems(['hash2']);

      expect(manager.getCacheStats().itemCount).to.equal(2);
    });
  });

  describe('TTL Expiration', () => {
    it('respects custom TTL', () => {
      const shortTTL = 100; // 100ms
      const shortManager = new LocalStorageCacheMetadataManager(
        testEndpoint,
        shortTTL,
      );

      shortManager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      expect(shortManager.isCacheValid()).to.be.true;

      cy.wait(150).then(() => {
        expect(shortManager.isCacheValid()).to.be.false;
      });
    });

    it('uses default TTL when not specified', () => {
      const defaultManager = new LocalStorageCacheMetadataManager(testEndpoint);

      defaultManager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const metadata = defaultManager.getCacheMetadata();
      const expectedExpiration = Date.now() + 2 * 60 * 60 * 1000; // 2 hours

      // Allow 1 second tolerance for test execution time
      expect(metadata?.cacheExpirationTimestamp).to.be.closeTo(
        expectedExpiration,
        1000,
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      const success = manager.updateCache([]);
      expect(success).to.be.true;

      const metadata = manager.getCacheMetadata();
      expect(metadata?.items.size).to.equal(0);
    });

    it('handles items with special characters in sdHash', () => {
      const specialHash = 'hash-with-special!@#$%^&*()_+=[]{}|;:,.<>?';
      manager.updateCache([
        {
          sdHash: specialHash,
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const item = manager.getItemMetadata(specialHash);
      expect(item).to.exist;
      expect(item?.sdHash).to.equal(specialHash);
    });

    it('handles very long sdHash values', () => {
      const longHash = 'a'.repeat(1000);
      manager.updateCache([
        {
          sdHash: longHash,
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const item = manager.getItemMetadata(longHash);
      expect(item).to.exist;
      expect(item?.sdHash).to.equal(longHash);
    });

    it('handles endpoints with special characters', () => {
      const specialEndpoint = 'https://api.example.com/path?query=1&foo=bar#hash';
      const specialManager = new LocalStorageCacheMetadataManager(
        specialEndpoint,
      );

      specialManager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const metadata = specialManager.getCacheMetadata();
      expect(metadata).to.exist;
      expect(metadata?.items.size).to.equal(1);
    });

    it('handles concurrent updates correctly', () => {
      manager.updateCache([
        {
          sdHash: 'hash1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      // Simulate concurrent update with different data
      manager.updateCache([
        {
          sdHash: 'hash2',
          uploadDatetime: '2024-01-02T00:00:00Z',
          statusDatetime: '2024-01-02T00:00:00Z',
          cachedAt: Date.now(),
        },
      ]);

      const metadata = manager.getCacheMetadata();
      expect(metadata?.items.size).to.equal(2);
      expect(metadata?.items.has('hash1')).to.be.true;
      expect(metadata?.items.has('hash2')).to.be.true;
    });
  });
});
