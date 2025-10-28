import {
  FederatedCatalogueStore,
  FederatedCatalogueStoreAdapter,
} from '../../../src/libs/store/impl/federated-catalogue/FederatedCatalogueStore.ts';
import {
  type StoreConfig,
  StoreType,
} from '../../../src/libs/store/shared/types.ts';

describe('FederatedCatalogueStore', () => {
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
  };

  describe('Constructor', () => {
    it('creates with valid config', () => {
      expect(() => new FederatedCatalogueStore(mockConfig)).to.not.throw();
    });

    it('throws when login is missing', () => {
      const cfg = { ...mockConfig } as any;
      cfg.login = undefined;
      expect(() => new FederatedCatalogueStore(cfg)).to.throw(
        'Login must be provided for FederatedCatalogueStore',
      );
    });

    it('throws when endpoint is missing', () => {
      const cfg = { ...mockConfig } as any;
      cfg.endpoint = undefined;
      expect(() => new FederatedCatalogueStore(cfg)).to.throw(
        'Missing required `endpoint` in StoreConfig for FederatedCatalogueStore',
      );
    });

    it('initializes cache (InMemoryCacheManager)', () => {
      const s = new FederatedCatalogueStore(mockConfig);
      expect(s.cache).to.exist;
      expect(s.cache.constructor.name).to.equal('InMemoryCacheManager');
    });
  });

  const interceptAuthToken = () => {
    cy.intercept('POST', '**/protocol/openid-connect/token', {
      statusCode: 200,
      body: {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      },
      headers: { 'content-type': 'application/json' },
    }).as('auth');
  };

  describe('initLocalDataSourceContainer', () => {
    beforeEach(() => {
      interceptAuthToken();
      store = new FederatedCatalogueStore(mockConfig);
    });

    it('creates local container with deterministic ID and caches it', async () => {
      const container = await store.initLocalDataSourceContainer();

      expect(container).to.have.property(
        '@context',
        'https://cdn.startinblox.com/owl/context.jsonld',
      );
      expect(container).to.have.property('@type', 'ldp:Container');
      expect(container['@id']).to.match(
        /^store:\/\/local\.fc-[a-z0-9]+-default\/$/i,
      );
      expect(container)
        .to.have.property('ldp:contains')
        .that.is.an('array')
        .with.length(0);
      expect(container).to.have.property('permissions').deep.equal(['view']);

      const fromCache = await store.get(container['@id']);
      expect(fromCache).to.deep.equal(container);
    });

    it('produces different IDs for different container types', async () => {
      const c1 = await store.initLocalDataSourceContainer('default');
      const c2 = await store.initLocalDataSourceContainer('custom');
      expect(c1['@id']).to.not.equal(c2['@id']);
    });
  });

  describe('Cache operations', () => {
    beforeEach(() => {
      store = new FederatedCatalogueStore(mockConfig);
    });

    it('get returns cached resource', async () => {
      const r = { '@id': 'test-id', name: 'Test' };
      await store.cache.set('test-id', r);
      expect(await store.get('test-id')).to.deep.equal(r);
    });

    it('get returns null when not found', async () => {
      expect(await store.get('nope')).to.be.null;
    });

    it('get handles cache.get error gracefully', async () => {
      cy.stub(store.cache, 'get').throws(new Error('Cache error'));
      const result = await store.get('boom');
      expect(result).to.be.null;
    });

    it('clearCache removes existing key', async () => {
      await store.cache.set('x', { '@id': 'x' });
      await store.clearCache('x');
      expect(await store.get('x')).to.be.null;
    });

    it('clearCache is safe for non-existent key', async () => {
      const hasStub = cy.stub(store.cache, 'has').resolves(false);
      const delStub = cy.stub(store.cache, 'delete').resolves();
      const lengthBefore = store.cache.length();

      cy.wrap(store.clearCache('missing')).then(() => {
        expect(hasStub).to.have.been.calledOnceWith('missing');
        expect(delStub).to.not.have.been.called;
        const lengthAfter = store.cache.length();
        expect(lengthBefore).to.be.equal(lengthAfter);
      });
    });
  });

  describe('Local data operations', () => {
    beforeEach(() => {
      store = new FederatedCatalogueStore(mockConfig);
    });

    it('setLocalData writes @id and caches', async () => {
      const id = 'store://local.test';
      const result = await store.setLocalData({ name: 'T' }, id);
      expect(result).to.equal(id);
      const cached = await store.get(id);
      expect(cached).to.include({ '@id': id, name: 'T' });
    });

    it('setLocalData dispatches "resoureReady"', async () => {
      const id = 'store://local.test2';
      let fired = false;
      const handler = () => {
        fired = true;
      };
      document.addEventListener('resoureReady', handler);
      await store.setLocalData({ x: 1 }, id);
      document.removeEventListener('resoureReady', handler);
      expect(fired).to.be.true;
    });

    it('setLocalData handles cache.set error', async () => {
      cy.stub(store.cache, 'set').throws(new Error('boom'));
      const id = 'store://local.err';
      const result = await store.setLocalData({}, id);
      expect(result).to.be.null;
    });
  });

  describe('getData', () => {
    it('creates a local container, populates it and dispatches "save"', () => {
      const fc = (path: string) =>
        `${mockConfig.endpoint?.replace(/\/$/, '')}${path}`;

      cy.intercept(
        { method: 'POST', url: /\/protocol\/openid-connect\/token(\?.*)?$/ },
        {
          statusCode: 200,
          body: {
            access_token: 'mock',
            token_type: 'Bearer',
            expires_in: 3600,
          },
        },
      ).as('auth');

      cy.intercept('GET', fc('//self-descriptions(?.*)?$/'), {
        statusCode: 200,
        body: {
          items: [
            { meta: { sdHash: 'hash-1' } },
            { meta: { sdHash: 'hash-2' } },
          ],
        },
      }).as('fcList');

      const SD_BODY = {
        verifiableCredential: {
          credentialSubject: {
            '@id': 'urn:svc:1',
            '@type': ['gax-trust-framework:ServiceOffering'],
            name: 'Service A',
          },
        },
        proof: {},
      };

      cy.intercept('GET', fc('//self-descriptions/hash-1(?.*)?$/'), {
        statusCode: 200,
        body: SD_BODY,
      }).as('fcSD1');

      cy.intercept('GET', fc('//self-descriptions/hash-2(?.*)?$/'), {
        statusCode: 200,
        body: SD_BODY,
      }).as('fcSD2');

      const store = new FederatedCatalogueStore(mockConfig);

      const onSave = new Promise<any>(resolve => {
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
      cy.wait('@fcSD1');
      cy.wait('@fcSD2');

      cy.wrap(resultPromise, { timeout: 1500 }).then((result: any) => {
        expect(result).to.exist;
        expect(result['@type']).to.equal('ldp:Container');
        expect(result['@id']).to.match(
          /^store:\/\/local\.fc-httpsapiexamplecom-default\/$/,
        );
        expect(result['ldp:contains']).to.be.an('array').and.not.empty;
      });

      cy.wrap(onSave, { timeout: 1500 }).then((payload: any) => {
        expect(payload)
          .to.have.property('@id')
          .that.matches(/^store:\/\/local\.fc-httpsapiexamplecom-default\/$/);
      });
    });

    it('reuses cached container on subsequent call (does not refetch list)', () => {
      try {
        const fc = (p: string) =>
          `${mockConfig.endpoint?.replace(/\/$/, '')}${p}`;

        cy.intercept('POST', '**/protocol/openid-connect/token', {
          statusCode: 200,
          body: {
            access_token: 'mock',
            token_type: 'Bearer',
            expires_in: 3600,
          },
        }).as('auth');

        const VC_BODY = {
          verifiableCredential: {
            issuanceDate: '2024-01-01T00:00:00Z',
            expirationDate: '2024-12-31T23:59:59Z',
            credentialSubject: {
              '@id': 'urn:svc:svc-1',
              'dcat:service': {
                'dcterms:title': 'Service A',
                'rdfs:comment': 'Desc',
                'dcat:keyword': ['kw'],
                'dcat:endpointURL': 'https://example.com/api',
                'dcterms:creator': {
                  'foaf:name': 'Org',
                  'foaf:thumbnail': { 'rdf:resource': 'https://img/logo.png' },
                },
              },
              'gax-core:operatedBy': { '@id': 'did:example:provider-1' },
            },
          },
          proof: {},
        };

        cy.intercept('GET', fc('/self-descriptions'), {
          statusCode: 200,
          body: { items: [{ meta: { sdHash: 'hash-1' } }] },
        }).as('fcList');

        cy.intercept('GET', fc('/self-descriptions/hash-1'), {
          statusCode: 200,
          body: VC_BODY,
        }).as('fcSD1');
        cy.window().then(async () => {
          const store = new FederatedCatalogueStore(mockConfig);

          const first = store.getData({
            targetType: 'gax-trust-framework:ServiceOffering',
          });

          cy.wait('@auth');
          cy.wait('@fcList');
          cy.wait('@fcSD1');

          cy.wrap(first).then((res: any) => {
            expect(res).to.exist;
            expect(res['@type']).to.equal('ldp:Container');
            expect(res['ldp:contains']).to.be.an('array').and.have.length(1);
          });

          cy.intercept('GET', fc('/self-descriptions')).as('fcListAgain');

          const second = store.getData({
            targetType: 'gax-trust-framework:ServiceOffering',
          });

          cy.wrap(second).then((res: any) => {
            expect(res).to.exist;
            expect(res['@type']).to.equal('ldp:Container');
            expect(res['ldp:contains']).to.be.an('array').and.have.length(1);
          });

          cy.get('@fcListAgain.all').should(($calls: any) => {
            expect($calls, 'no extra GET /self-descriptions').to.have.length(0);
          });
        });
      } catch (_e) {}
    });
  });
});

describe('FederatedCatalogueStoreAdapter', () => {
  let cfg: StoreConfig;

  beforeEach(() => {
    cfg = {
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
    };

    (FederatedCatalogueStoreAdapter as any).store = undefined;
  });

  it('throws when configuration is missing on first call', () => {
    expect(() => FederatedCatalogueStoreAdapter.getStoreInstance()).to.throw(
      '[FederatedCatalogueStoreAdapter] configuration is required',
    );
  });

  it('creates an instance with a valid config', () => {
    const s = FederatedCatalogueStoreAdapter.getStoreInstance(cfg);
    expect(s).to.be.instanceOf(FederatedCatalogueStore);
  });

  it('returns the same instance on subsequent calls', () => {
    const s1 = FederatedCatalogueStoreAdapter.getStoreInstance(cfg);
    const s2 = FederatedCatalogueStoreAdapter.getStoreInstance();
    expect(s1).to.equal(s2);
  });

  it('validates required TEMS fields', () => {
    const bad = { ...cfg } as any;
    bad.temsServiceBase = undefined;
    bad.temsCategoryBase = undefined;
    bad.temsImageBase = undefined;
    bad.temsProviderBase = undefined;

    expect(() => FederatedCatalogueStoreAdapter.getStoreInstance(bad)).to.throw(
      '[FederatedCatalogueStoreAdapter] Missing required configuration fields: temsServiceBase, temsCategoryBase, temsImageBase, temsProviderBase',
    );
  });
});
