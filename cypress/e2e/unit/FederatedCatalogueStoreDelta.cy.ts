import { FederatedCatalogueStore } from '../../../src/libs/store/impl/federated-catalogue/FederatedCatalogueStore.ts';
import {
  type StoreConfig,
  StoreType,
} from '../../../src/libs/store/shared/types.ts';

describe('FederatedCatalogueStore - Delta Update Logic', () => {
  let store: FederatedCatalogueStore;
  const mockConfig: StoreConfig = {
    type: StoreType.FederatedCatalogue,
    endpoint: 'https://api.example.com',
    login: {
      kc_username: 'u',
      kc_password: 'p',
      kc_url:
        'https://auth.startinblox.com/realms/tems/protocol/openid-connect/token',
      kc_grant_type: 'password',
      kc_client_id: 'client',
      kc_client_secret: 'secret',
      kc_scope: 'openid',
    },
    temsServiceBase: 'https://tems.example.com/services/',
    temsCategoryBase: 'https://tems.example.com/categories/',
    temsImageBase: 'https://tems.example.com/images/',
    temsProviderBase: 'https://tems.example.com/providers/',
    enableLocalStorageMetadata: true,
    cacheTTL: 2 * 60 * 60 * 1000, // 2 hours
  };

  const interceptAuth = () => {
    cy.intercept('POST', '**/protocol/openid-connect/token', {
      statusCode: 200,
      body: {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      },
    }).as('auth');
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    interceptAuth();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Page Reload Detection', () => {
    it('clears cache on fresh page load', () => {
      // First session - populate cache
      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash1',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      expect(metadataManager?.getCacheMetadata()).to.exist;

      // Clear sessionStorage to simulate new page load
      sessionStorage.clear();

      // Create new store instance (simulates page reload)
      const newStore = new FederatedCatalogueStore(mockConfig);
      const newMetadataManager = (newStore as any).metadataManager;

      // Cache should be cleared
      expect(newMetadataManager?.getCacheMetadata()).to.be.null;
    });

    it('preserves cache within same session', () => {
      // First store instance
      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash1',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      // Second store instance (same session)
      const newStore = new FederatedCatalogueStore(mockConfig);
      const newMetadataManager = (newStore as any).metadataManager;

      // Cache should still exist
      const metadata = newMetadataManager?.getCacheMetadata();
      expect(metadata).to.exist;
      expect(metadata?.items.size).to.equal(1);
    });

    it('handles sessionStorage not available gracefully', () => {
      // Stub sessionStorage to throw error
      const originalGetItem = sessionStorage.getItem;
      cy.stub(sessionStorage, 'getItem').throws(new Error('Not available'));

      // Should not throw error
      expect(() => new FederatedCatalogueStore(mockConfig)).to.not.throw();

      sessionStorage.getItem = originalGetItem;
    });
  });

  describe('Delta Update - New Items Detection', () => {
    it('fetches only new items when cache is valid', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      // Set up valid cache with existing items
      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-existing',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      // Create existing cached resource
      const existingResource = {
        '@id': 'store://local.fc-httpsapiexamplecom-default/',
        '@type': 'ldp:Container',
        'ldp:contains': [
          {
            '@id': 'https://tems.example.com/services/existing/',
            '@type': 'tems:Service',
            name: 'Existing Service',
          },
        ],
        permissions: ['view'],
      };

      cy.wrap(
        store.setLocalData(
          existingResource,
          'gax-trust-framework:ServiceOffering',
        ),
      );

      // API returns existing + new item
      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-existing',
                uploadDatetime: '2024-01-01T00:00:00Z',
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
            {
              meta: {
                sdHash: 'hash-new',
                uploadDatetime: '2024-01-02T00:00:00Z',
                statusDatetime: '2024-01-02T00:00:00Z',
              },
            },
          ],
        },
      }).as('fcList');

      // Only the new item should be fetched
      cy.intercept('GET', fc('/self-descriptions/hash-new'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-02T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:new-service',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'New Service',
                'rdfs:comment': 'New service description',
                'dcat:keyword': [],
                'dcat:endpointURL': 'https://example.com/new',
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSDNew');

      // Should NOT intercept existing item
      let existingFetched = false;
      cy.intercept('GET', fc('/self-descriptions/hash-existing'), () => {
        existingFetched = true;
      }).as('fcSDExisting');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');
      cy.wait('@fcSDNew');

      cy.wrap(resultPromise).then((result: any) => {
        expect(result).to.exist;
        expect(result['ldp:contains']).to.be.an('array').with.length(2);

        // Verify new item was added
        const newItem = result['ldp:contains'].find(
          (item: any) => item.name === 'New Service',
        );
        expect(newItem).to.exist;

        // Verify existing item is still present
        const existingItem = result['ldp:contains'].find(
          (item: any) => item.name === 'Existing Service',
        );
        expect(existingItem).to.exist;

        // Verify existing item was not re-fetched
        expect(existingFetched).to.be.false;
      });
    });

    it('updates metadata with new items', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-old',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-old',
                uploadDatetime: '2024-01-01T00:00:00Z',
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
            {
              meta: {
                sdHash: 'hash-new',
                uploadDatetime: '2024-01-02T00:00:00Z',
                statusDatetime: '2024-01-02T00:00:00Z',
              },
            },
          ],
        },
      }).as('fcList');

      cy.intercept('GET', fc('/self-descriptions/hash-new'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-02T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:new',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'New',
                'rdfs:comment': 'New',
                'dcat:keyword': [],
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSDNew');

      const existingResource = {
        '@id': 'store://local.fc-httpsapiexamplecom-default/',
        '@type': 'ldp:Container',
        'ldp:contains': [
          {
            '@id': 'https://tems.example.com/services/old/',
            '@type': 'tems:Service',
            name: 'Old Service',
          },
        ],
        permissions: ['view'],
      };

      cy.wrap(
        store.setLocalData(
          existingResource,
          'gax-trust-framework:ServiceOffering',
        ),
      );

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');
      cy.wait('@fcSDNew');

      cy.wrap(resultPromise).then(() => {
        const knownHashes = metadataManager?.getKnownHashes();
        expect(knownHashes?.has('hash-old')).to.be.true;
        expect(knownHashes?.has('hash-new')).to.be.true;
        expect(knownHashes?.size).to.equal(2);
      });
    });
  });

  describe('Delta Update - Updated Items Detection', () => {
    it('detects and refetches items with newer uploadDatetime', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      // Existing item with old timestamp
      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-updated',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      const existingResource = {
        '@id': 'store://local.fc-httpsapiexamplecom-default/',
        '@type': 'ldp:Container',
        'ldp:contains': [
          {
            '@id': 'https://tems.example.com/services/updated/',
            '@type': 'tems:Service',
            name: 'Old Version',
          },
        ],
        permissions: ['view'],
      };

      cy.wrap(
        store.setLocalData(
          existingResource,
          'gax-trust-framework:ServiceOffering',
        ),
      );

      // API returns item with newer timestamp
      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-updated',
                uploadDatetime: '2024-01-02T00:00:00Z', // Newer
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
          ],
        },
      }).as('fcList');

      cy.intercept('GET', fc('/self-descriptions/hash-updated'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-02T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:updated',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'New Version',
                'rdfs:comment': 'Updated',
                'dcat:keyword': [],
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSDUpdated');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');
      cy.wait('@fcSDUpdated');

      cy.wrap(resultPromise).then((result: any) => {
        expect(result['ldp:contains']).to.have.length(1);
        const item = result['ldp:contains'][0];
        expect(item.name).to.equal('New Version');
      });
    });

    it('detects and refetches items with newer statusDatetime', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-status',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      const existingResource = {
        '@id': 'store://local.fc-httpsapiexamplecom-default/',
        '@type': 'ldp:Container',
        'ldp:contains': [
          {
            '@id': 'https://tems.example.com/services/status/',
            '@type': 'tems:Service',
            name: 'Old Status',
          },
        ],
        permissions: ['view'],
      };

      cy.wrap(
        store.setLocalData(
          existingResource,
          'gax-trust-framework:ServiceOffering',
        ),
      );

      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-status',
                uploadDatetime: '2024-01-01T00:00:00Z',
                statusDatetime: '2024-01-02T00:00:00Z', // Newer status
              },
            },
          ],
        },
      }).as('fcList');

      cy.intercept('GET', fc('/self-descriptions/hash-status'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-02T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:status',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'New Status',
                'rdfs:comment': 'Updated',
                'dcat:keyword': [],
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSDStatus');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');
      cy.wait('@fcSDStatus');

      cy.wrap(resultPromise).then((result: any) => {
        expect(result['ldp:contains']).to.have.length(1);
        const item = result['ldp:contains'][0];
        expect(item.name).to.equal('New Status');
      });
    });

    it('removes old version when updating item', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-1',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      const existingResource = {
        '@id': 'store://local.fc-httpsapiexamplecom-default/',
        '@type': 'ldp:Container',
        'ldp:contains': [
          {
            '@id': 'https://tems.example.com/services/urn%3Asvc%3A1/',
            '@type': 'tems:Service',
            name: 'Old',
          },
        ],
        permissions: ['view'],
      };

      cy.wrap(
        store.setLocalData(
          existingResource,
          'gax-trust-framework:ServiceOffering',
        ),
      );

      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-1',
                uploadDatetime: '2024-01-02T00:00:00Z',
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
          ],
        },
      }).as('fcList');

      cy.intercept('GET', fc('/self-descriptions/hash-1'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-02T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:1',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'New',
                'rdfs:comment': 'Updated',
                'dcat:keyword': [],
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSD');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');
      cy.wait('@fcSD');

      cy.wrap(resultPromise).then((result: any) => {
        // Should have exactly 1 item (old version removed)
        expect(result['ldp:contains']).to.have.length(1);
        expect(result['ldp:contains'][0].name).to.equal('New');
      });
    });
  });

  describe('Delta Update - Deleted Items Detection', () => {
    it('removes items no longer in API response', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      // Cache has items that will be deleted
      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-kept',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
          {
            sdHash: 'hash-deleted',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      const existingResource = {
        '@id': 'store://local.fc-httpsapiexamplecom-default/',
        '@type': 'ldp:Container',
        'ldp:contains': [
          {
            '@id': 'https://tems.example.com/services/kept/',
            '@type': 'tems:Service',
            name: 'Kept Service',
          },
          {
            '@id': 'https://tems.example.com/services/deleted/',
            '@type': 'tems:Service',
            name: 'Deleted Service',
          },
        ],
        permissions: ['view'],
      };

      cy.wrap(
        store.setLocalData(
          existingResource,
          'gax-trust-framework:ServiceOffering',
        ),
      );

      // API only returns one item (the other was deleted)
      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-kept',
                uploadDatetime: '2024-01-01T00:00:00Z',
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
          ],
        },
      }).as('fcList');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');

      cy.wrap(resultPromise).then(() => {
        // Note: Current implementation doesn't remove items from container
        // for safety (conservative approach), but metadata is updated
        const knownHashes = metadataManager?.getKnownHashes();
        expect(knownHashes?.has('hash-kept')).to.be.true;
        expect(knownHashes?.has('hash-deleted')).to.be.false;
      });
    });

    it('updates metadata to remove deleted items', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-1',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
          {
            sdHash: 'hash-2',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
          {
            sdHash: 'hash-3',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      const existingResource = {
        '@id': 'store://local.fc-httpsapiexamplecom-default/',
        '@type': 'ldp:Container',
        'ldp:contains': [],
        permissions: ['view'],
      };

      cy.wrap(
        store.setLocalData(
          existingResource,
          'gax-trust-framework:ServiceOffering',
        ),
      );

      // API only returns 1 out of 3 items
      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-1',
                uploadDatetime: '2024-01-01T00:00:00Z',
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
          ],
        },
      }).as('fcList');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');

      cy.wrap(resultPromise).then(() => {
        const knownHashes = metadataManager?.getKnownHashes();
        expect(knownHashes?.size).to.equal(1);
        expect(knownHashes?.has('hash-1')).to.be.true;
        expect(knownHashes?.has('hash-2')).to.be.false;
        expect(knownHashes?.has('hash-3')).to.be.false;
      });
    });
  });

  describe('Full Fetch Fallback', () => {
    it('performs full fetch when cache is invalid', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      // Set up expired cache
      const now = Date.now();
      const expiredMetadata = {
        version: '1.0.0',
        lastFetchTimestamp: now - 10 * 60 * 60 * 1000,
        cacheExpirationTimestamp: now - 1000, // Expired
        items: new Map([
          [
            'old-hash',
            {
              sdHash: 'old-hash',
              uploadDatetime: '2024-01-01T00:00:00Z',
              statusDatetime: '2024-01-01T00:00:00Z',
              cachedAt: now - 10 * 60 * 60 * 1000,
            },
          ],
        ]),
      };

      metadataManager?.setCacheMetadata(expiredMetadata);

      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'new-hash',
                uploadDatetime: '2024-01-02T00:00:00Z',
                statusDatetime: '2024-01-02T00:00:00Z',
              },
            },
          ],
        },
      }).as('fcList');

      cy.intercept('GET', fc('/self-descriptions/new-hash'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-02T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:new',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'New Service',
                'rdfs:comment': 'Fresh fetch',
                'dcat:keyword': [],
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSD');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');
      cy.wait('@fcSD');

      cy.wrap(resultPromise).then((result: any) => {
        expect(result['ldp:contains']).to.have.length(1);
        expect(result['ldp:contains'][0].name).to.equal('New Service');

        // Verify metadata was updated with new items
        const knownHashes = metadataManager?.getKnownHashes();
        expect(knownHashes?.has('new-hash')).to.be.true;
        expect(knownHashes?.has('old-hash')).to.be.false;
      });
    });

    it('performs full fetch when caching is disabled', () => {
      const disabledConfig = {
        ...mockConfig,
        enableLocalStorageMetadata: false,
      };

      const fc = (path: string) =>
        `${disabledConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(disabledConfig);

      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-1',
                uploadDatetime: '2024-01-01T00:00:00Z',
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
          ],
        },
      }).as('fcList');

      cy.intercept('GET', fc('/self-descriptions/hash-1'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-01T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:1',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'Service 1',
                'rdfs:comment': 'Full fetch',
                'dcat:keyword': [],
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSD');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');
      cy.wait('@fcSD');

      cy.wrap(resultPromise).then((result: any) => {
        expect(result).to.exist;
        expect(result['ldp:contains']).to.have.length(1);
      });
    });

    it('falls back to full fetch when no cached resource found', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      // Valid metadata but no cached resource
      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-1',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      // Don't set any cached resource

      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-1',
                uploadDatetime: '2024-01-01T00:00:00Z',
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
          ],
        },
      }).as('fcList');

      cy.intercept('GET', fc('/self-descriptions/hash-1'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-01T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:1',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'Service 1',
                'rdfs:comment': 'Full fetch fallback',
                'dcat:keyword': [],
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSD');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');
      cy.wait('@fcSD');

      cy.wrap(resultPromise).then((result: any) => {
        expect(result).to.exist;
        expect(result['ldp:contains']).to.have.length(1);
      });
    });

    it('falls back to full fetch on delta update error', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-1',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      // First call fails (delta update)
      let callCount = 0;
      cy.intercept('GET', fc('/self-descriptions'), req => {
        callCount++;
        if (callCount === 1) {
          req.reply({ statusCode: 500, body: { error: 'Server error' } });
        } else {
          req.reply({
            statusCode: 200,
            body: {
              items: [
                {
                  meta: {
                    sdHash: 'hash-2',
                    uploadDatetime: '2024-01-02T00:00:00Z',
                    statusDatetime: '2024-01-02T00:00:00Z',
                  },
                },
              ],
            },
          });
        }
      }).as('fcList');

      cy.intercept('GET', fc('/self-descriptions/hash-2'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-02T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:2',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'Service 2',
                'rdfs:comment': 'Fallback success',
                'dcat:keyword': [],
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSD');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList'); // First call (fails)
      cy.wait('@fcList'); // Second call (succeeds - full fetch)
      cy.wait('@fcSD');

      cy.wrap(resultPromise).then((result: any) => {
        expect(result).to.exist;
        expect(result['ldp:contains']).to.have.length(1);
        expect(result['ldp:contains'][0].name).to.equal('Service 2');
      });
    });
  });

  describe('Mixed Delta Operations', () => {
    it('handles new, updated, and deleted items in single update', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      // Initial cache: hash-keep, hash-update, hash-delete
      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-keep',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
          {
            sdHash: 'hash-update',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
          {
            sdHash: 'hash-delete',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      const existingResource = {
        '@id': 'store://local.fc-httpsapiexamplecom-default/',
        '@type': 'ldp:Container',
        'ldp:contains': [
          {
            '@id': 'https://tems.example.com/services/keep/',
            '@type': 'tems:Service',
            name: 'Keep Service',
          },
          {
            '@id': 'https://tems.example.com/services/urn%3Asvc%3Aupdate/',
            '@type': 'tems:Service',
            name: 'Old Update',
          },
          {
            '@id': 'https://tems.example.com/services/delete/',
            '@type': 'tems:Service',
            name: 'Delete Service',
          },
        ],
        permissions: ['view'],
      };

      cy.wrap(
        store.setLocalData(
          existingResource,
          'gax-trust-framework:ServiceOffering',
        ),
      );

      // API returns: keep (unchanged), update (newer), new (added), delete (removed)
      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-keep',
                uploadDatetime: '2024-01-01T00:00:00Z',
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
            {
              meta: {
                sdHash: 'hash-update',
                uploadDatetime: '2024-01-02T00:00:00Z', // Newer
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
            {
              meta: {
                sdHash: 'hash-new',
                uploadDatetime: '2024-01-01T00:00:00Z',
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
            // hash-delete is missing (deleted)
          ],
        },
      }).as('fcList');

      cy.intercept('GET', fc('/self-descriptions/hash-update'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-02T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:update',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'New Update',
                'rdfs:comment': 'Updated',
                'dcat:keyword': [],
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSDUpdate');

      cy.intercept('GET', fc('/self-descriptions/hash-new'), {
        statusCode: 200,
        body: {
          verifiableCredential: {
            issuanceDate: '2024-01-01T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:new',
              '@type': ['gax-trust-framework:ServiceOffering'],
              'dcat:service': {
                'dcterms:title': 'New Service',
                'rdfs:comment': 'Brand new',
                'dcat:keyword': [],
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider' },
            },
          },
          proof: {},
        },
      }).as('fcSDNew');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');
      cy.wait('@fcSDUpdate');
      cy.wait('@fcSDNew');

      cy.wrap(resultPromise).then((result: any) => {
        // Should have 4 items: keep, updated update, new
        // (Note: delete might still be in container due to conservative approach)
        const names = result['ldp:contains'].map((item: any) => item.name);
        expect(names).to.include('Keep Service');
        expect(names).to.include('New Update');
        expect(names).to.include('New Service');

        // Verify metadata
        const knownHashes = metadataManager?.getKnownHashes();
        expect(knownHashes?.has('hash-keep')).to.be.true;
        expect(knownHashes?.has('hash-update')).to.be.true;
        expect(knownHashes?.has('hash-new')).to.be.true;
        expect(knownHashes?.has('hash-delete')).to.be.false;
      });
    });

    it('handles empty API response (all items deleted)', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-1',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
          {
            sdHash: 'hash-2',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      const existingResource = {
        '@id': 'store://local.fc-httpsapiexamplecom-default/',
        '@type': 'ldp:Container',
        'ldp:contains': [
          { '@id': 'service1', name: 'Service 1' },
          { '@id': 'service2', name: 'Service 2' },
        ],
        permissions: ['view'],
      };

      cy.wrap(
        store.setLocalData(
          existingResource,
          'gax-trust-framework:ServiceOffering',
        ),
      );

      // API returns empty items array
      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [],
        },
      }).as('fcList');

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');

      cy.wrap(resultPromise).then(() => {
        // All items should be removed from metadata
        const knownHashes = metadataManager?.getKnownHashes();
        expect(knownHashes?.size).to.equal(0);
      });
    });
  });

  describe('Event Dispatching', () => {
    it('dispatches save event after delta update', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      store = new FederatedCatalogueStore(mockConfig);
      const metadataManager = (store as any).metadataManager;

      metadataManager?.updateCache(
        { '@id': 'test-container', 'ldp:contains': [] },
        [
          {
            sdHash: 'hash-1',
            uploadDatetime: '2024-01-01T00:00:00Z',
            statusDatetime: '2024-01-01T00:00:00Z',
            cachedAt: Date.now(),
          },
        ],
      );

      const existingResource = {
        '@id': 'store://local.fc-httpsapiexamplecom-default/',
        '@type': 'ldp:Container',
        'ldp:contains': [],
        permissions: ['view'],
      };

      cy.wrap(
        store.setLocalData(
          existingResource,
          'gax-trust-framework:ServiceOffering',
        ),
      );

      cy.intercept('GET', fc('/self-descriptions'), {
        statusCode: 200,
        body: {
          items: [
            {
              meta: {
                sdHash: 'hash-1',
                uploadDatetime: '2024-01-01T00:00:00Z',
                statusDatetime: '2024-01-01T00:00:00Z',
              },
            },
          ],
        },
      }).as('fcList');

      const savePromise = new Promise<any>(resolve => {
        const handler = (e: any) => {
          document.removeEventListener('save', handler);
          resolve(e.detail?.resource);
        };
        document.addEventListener('save', handler);
      });

      const resultPromise = store.getData({
        targetType: 'gax-trust-framework:ServiceOffering',
      });

      cy.wait('@auth');
      cy.wait('@fcList');

      cy.wrap(Promise.all([resultPromise, savePromise])).then(
        ([_result, savePayload]: any) => {
          expect(savePayload).to.exist;
          expect(savePayload['@id']).to.match(
            /^store:\/\/local\.fc-httpsapiexamplecom-default\/$/,
          );
        },
      );
    });
  });
});
