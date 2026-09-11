import { getFederatedCatalogueDcpAPIWrapper } from '../../../src/libs/store/impl/federated-catalogue-dcp/FederatedCatalogueDcpAPIWrapper-instance.ts';
import { FederatedCatalogueDcpAPIWrapper } from '../../../src/libs/store/impl/federated-catalogue-dcp/FederatedCatalogueDcpAPIWrapper.ts';
import {
  FederatedCatalogueDcpStore,
  FederatedCatalogueDcpStoreAdapter,
} from '../../../src/libs/store/impl/federated-catalogue-dcp/FederatedCatalogueDcpStore.ts';
import type {
  DcpCatalog,
  DcpDataset,
} from '../../../src/libs/store/impl/federated-catalogue-dcp/interfaces.ts';
import {
  type StoreConfig,
  StoreType,
} from '../../../src/libs/store/shared/types.ts';

/**
 * Fixture — two catalogs (participants A and B), two datasets each.
 * Shape kept strictly to fields declared in `interfaces.ts`; enough for
 * the mapper to exercise both nested-dcat:service and top-level metadata
 * paths as well as single-vs-array normalization of `dcat:dataset`.
 */
const buildDcpFixture = (): DcpCatalog[] => [
  {
    '@id': 'urn:cat:participant-a',
    '@type': 'dcat:Catalog',
    'dspace:participantId': 'did:web:participant-a',
    originator: 'https://a.example/dsp',
    'dcat:service': {
      '@id': 'urn:svc:a',
      '@type': 'dcat:DataService',
      'dcat:endpointURL': 'https://a.example/dsp',
    },
    'dcat:dataset': [
      {
        '@id': 'urn:uuid:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        '@type': 'dcat:Dataset',
        'dct:title': 'A - Dataset one',
        'rdfs:comment': 'Top-level metadata dataset',
        'dcat:keyword': ['alpha', 'one'],
        'dcat:version': '1.0.0',
        'odrl:hasPolicy': { '@id': 'urn:policy:a1' },
      },
      {
        '@id': 'urn:uuid:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        '@type': 'dcat:Dataset',
        // No top-level meta — mapper must fall back to nested dcat:service.
        'dcat:service': {
          '@type': 'dcat:DataService',
          'dct:title': 'A - Dataset two (from nested service)',
          'rdfs:comment': 'Nested-service metadata dataset',
          'dcat:keyword': 'beta',
          'dcat:version': '0.9.0',
        },
        'odrl:hasPolicy': { '@id': 'urn:policy:a2' },
      },
    ],
  },
  {
    '@id': 'urn:cat:participant-b',
    '@type': 'dcat:Catalog',
    'dspace:participantId': 'did:web:participant-b',
    // No dcat:service on the catalog — provider address should fall through
    // to `originator`.
    originator: 'https://b.example/dsp',
    // Single dataset expressed as a bare object (not an array) to exercise
    // normalizeDatasets on the singular shape.
    'dcat:dataset': {
      '@id': 'urn:uuid:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
      '@type': 'dcat:Dataset',
      'dct:title': 'B - Single dataset',
      'rdfs:comment': 'Singular payload',
    } as DcpDataset,
  },
];

// -----------------------------------------------------------------------------
// API wrapper
// -----------------------------------------------------------------------------

describe('FederatedCatalogueDcpAPIWrapper', () => {
  const jsonResponse = (body: unknown, init: Partial<ResponseInit> = {}) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });

  describe('Constructor', () => {
    it('strips trailing slashes from baseUrl', async () => {
      const captured: { url?: string } = {};
      const stubFetch: typeof fetch = ((url: string) => {
        captured.url = url;
        return Promise.resolve(jsonResponse([]));
      }) as any;

      const wrapper = new FederatedCatalogueDcpAPIWrapper(
        'https://api.example.com///',
        stubFetch,
      );
      await wrapper.getAggregatedCatalog();
      expect(captured.url).to.equal(
        'https://api.example.com/v1alpha/catalog/query?flatten=true',
      );
    });
  });

  describe('getAggregatedCatalog', () => {
    it('POSTs to /v1alpha/catalog/query with JSON-LD framing body', async () => {
      const captured: { url?: string; init?: RequestInit } = {};
      const stubFetch: typeof fetch = ((url: string, init: RequestInit) => {
        captured.url = url;
        captured.init = init;
        return Promise.resolve(jsonResponse([]));
      }) as any;

      const wrapper = new FederatedCatalogueDcpAPIWrapper(
        'https://api.example.com',
        stubFetch,
      );
      await wrapper.getAggregatedCatalog();

      expect(captured.url).to.equal(
        'https://api.example.com/v1alpha/catalog/query?flatten=true',
      );
      expect(captured.init?.method).to.equal('POST');

      const headers = captured.init?.headers as Record<string, string>;
      expect(headers['Content-Type']).to.equal('application/json');
      expect(headers.Accept).to.equal('application/json');

      const parsed = JSON.parse(String(captured.init?.body));
      expect(parsed).to.deep.equal({
        '@context': { edc: 'https://w3id.org/edc/v0.0.1/ns/' },
        '@type': 'QuerySpec',
      });
    });

    it('omits ?flatten=true when opts.flatten is false', async () => {
      const captured: { url?: string } = {};
      const stubFetch: typeof fetch = ((url: string) => {
        captured.url = url;
        return Promise.resolve(jsonResponse([]));
      }) as any;
      const wrapper = new FederatedCatalogueDcpAPIWrapper(
        'https://api.example.com',
        stubFetch,
      );
      await wrapper.getAggregatedCatalog({ flatten: false });
      expect(captured.url).to.equal(
        'https://api.example.com/v1alpha/catalog/query',
      );
    });

    it('returns an array payload unchanged', async () => {
      const fixture = buildDcpFixture();
      const stubFetch: typeof fetch = (() =>
        Promise.resolve(jsonResponse(fixture))) as any;

      const wrapper = new FederatedCatalogueDcpAPIWrapper(
        'https://api.example.com',
        stubFetch,
      );
      const result = await wrapper.getAggregatedCatalog();
      expect(result).to.deep.equal(fixture);
    });

    it('flattens an object-shaped payload to an array of catalog values', async () => {
      const [a, b] = buildDcpFixture();
      const objPayload = {
        // Extra scalar top-level key should be dropped (no '@type').
        meta: 'ignored',
        first: a,
        second: b,
      };
      const stubFetch: typeof fetch = (() =>
        Promise.resolve(jsonResponse(objPayload))) as any;

      const wrapper = new FederatedCatalogueDcpAPIWrapper(
        'https://api.example.com',
        stubFetch,
      );
      const result = await wrapper.getAggregatedCatalog();
      expect(result).to.be.an('array').with.length(2);
      expect(result[0]).to.have.property('@id', a['@id']);
      expect(result[1]).to.have.property('@id', b['@id']);
    });

    it('returns [] when the payload is neither array nor object', async () => {
      const stubFetch: typeof fetch = (() =>
        Promise.resolve(jsonResponse(null))) as any;

      const wrapper = new FederatedCatalogueDcpAPIWrapper(
        'https://api.example.com',
        stubFetch,
      );
      const result = await wrapper.getAggregatedCatalog();
      expect(result).to.deep.equal([]);
    });

    it('throws descriptively on non-2xx response', async () => {
      const stubFetch: typeof fetch = (() =>
        Promise.resolve(
          new Response('nope', {
            status: 502,
            statusText: 'Bad Gateway',
          }),
        )) as any;

      const wrapper = new FederatedCatalogueDcpAPIWrapper(
        'https://api.example.com',
        stubFetch,
      );

      let thrown: Error | undefined;
      try {
        await wrapper.getAggregatedCatalog();
      } catch (e) {
        thrown = e as Error;
      }
      expect(thrown, 'expected getAggregatedCatalog to throw').to.exist;
      expect(thrown?.message).to.include('502');
      expect(thrown?.message).to.include('Bad Gateway');
      expect(thrown?.message).to.include('/v1alpha/catalog/query');
    });
  });

  describe('getFederatedCatalogueDcpAPIWrapper (factory)', () => {
    it('memoizes by baseUrl (same baseUrl → same instance)', () => {
      const a1 = getFederatedCatalogueDcpAPIWrapper(
        'https://factory-a.example.com',
      );
      const a2 = getFederatedCatalogueDcpAPIWrapper(
        'https://factory-a.example.com',
      );
      expect(a1).to.equal(a2);
    });

    it('returns a distinct instance for a different baseUrl', () => {
      const a = getFederatedCatalogueDcpAPIWrapper(
        'https://factory-x.example.com',
      );
      const b = getFederatedCatalogueDcpAPIWrapper(
        'https://factory-y.example.com',
      );
      expect(a).to.not.equal(b);
    });
  });
});

// -----------------------------------------------------------------------------
// Store adapter
// -----------------------------------------------------------------------------

describe('FederatedCatalogueDcpStoreAdapter', () => {
  const cfg: StoreConfig = {
    type: StoreType.FederatedCatalogueDcp,
    endpoint: 'https://adapter.example.com',
  };

  it('throws when configuration is missing', () => {
    expect(() => FederatedCatalogueDcpStoreAdapter.getStoreInstance()).to.throw(
      '[FederatedCatalogueDcpStoreAdapter] configuration is required',
    );
  });

  it('throws when `endpoint` is missing', () => {
    const bad = { type: StoreType.FederatedCatalogueDcp } as StoreConfig;
    expect(() =>
      FederatedCatalogueDcpStoreAdapter.getStoreInstance(bad),
    ).to.throw(
      '[FederatedCatalogueDcpStoreAdapter] `endpoint` is required in StoreConfig',
    );
  });

  it('returns a fresh FederatedCatalogueDcpStore instance with a valid config', () => {
    const s1 = FederatedCatalogueDcpStoreAdapter.getStoreInstance(cfg);
    const s2 = FederatedCatalogueDcpStoreAdapter.getStoreInstance(cfg);
    expect(s1).to.be.instanceOf(FederatedCatalogueDcpStore);
    expect(s2).to.be.instanceOf(FederatedCatalogueDcpStore);
    expect(s1).to.not.equal(s2);
  });
});

// -----------------------------------------------------------------------------
// Store class
// -----------------------------------------------------------------------------

describe('FederatedCatalogueDcpStore', () => {
  const mockConfig: StoreConfig = {
    type: StoreType.FederatedCatalogueDcp,
    endpoint: 'https://dcp-store.example.com',
  };

  // Swap the store's memoized API wrapper for a fake — the wrapper's own
  // fetch path is exercised in the FederatedCatalogueDcpAPIWrapper block.
  const withFakeApi = (
    store: FederatedCatalogueDcpStore,
    fake: { getAggregatedCatalog: () => Promise<DcpCatalog[]> },
  ) => {
    (store as any).api = fake;
  };

  describe('Constructor', () => {
    it('creates with valid config', () => {
      expect(() => new FederatedCatalogueDcpStore(mockConfig)).to.not.throw();
    });

    it('throws when endpoint is missing', () => {
      const bad = { type: StoreType.FederatedCatalogueDcp } as StoreConfig;
      expect(() => new FederatedCatalogueDcpStore(bad)).to.throw(
        'Missing required `endpoint` in StoreConfig for FederatedCatalogueDcpStore',
      );
    });

    it('initializes cache (InMemoryCacheManager)', () => {
      const s = new FederatedCatalogueDcpStore(mockConfig);
      expect(s.cache).to.exist;
      expect(s.cache.constructor.name).to.equal('InMemoryCacheManager');
    });

    it('exposes the IStore stub surface (post/put/patch/delete → null)', async () => {
      const s = new FederatedCatalogueDcpStore(mockConfig);
      expect(await s.post({}, 'x')).to.be.null;
      expect(await s.put({}, 'x')).to.be.null;
      expect(await s.patch({}, 'x')).to.be.null;
      expect(await s.delete('x')).to.be.null;
    });
  });

  describe('getData', () => {
    it('flattens catalogs → datasets into one ldp:Container at a deterministic @id', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });

      const container = await store.getData({});

      expect(container).to.have.property(
        '@context',
        'https://cdn.startinblox.com/owl/context.jsonld',
      );
      expect(container).to.have.property('@type', 'ldp:Container');
      expect(container).to.have.property(
        '@id',
        `store://local.${mockConfig.endpoint}.default`,
      );
      expect(container).to.have.property('permissions').deep.equal(['view']);
      // 2 datasets in catalog A + 1 in catalog B (object-form) = 3.
      expect(container['ldp:contains']).to.be.an('array').with.length(3);
    });

    it('mints bare urn:uuid @ids (strips any incoming urn:uuid: prefix)', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });
      const container = await store.getData({});
      const ids = (container['ldp:contains'] as any[]).map(i => i['@id']);
      for (const id of ids) {
        expect(id).to.match(/^urn:uuid:[0-9a-f-]+$/i);
        // No double-prefix.
        expect(id).to.not.match(/^urn:uuid:urn:uuid:/i);
      }
    });

    it('normalizes both single-object and array shapes of dcat:dataset', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      const fromB = items.find(
        i => i['@id'] === 'urn:uuid:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
      );
      expect(fromB, 'singular dcat:dataset should be included').to.exist;
      expect(fromB.name).to.equal('B - Single dataset');
    });

    it('populates provider from dspace:participantId + catalog dcat:service endpointURL', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      const fromA1 = items.find(
        i => i['@id'] === 'urn:uuid:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      );
      expect(fromA1.provider).to.deep.equal({
        '@id': 'did:web:participant-a',
        name: 'did:web:participant-a',
        address: 'https://a.example/dsp',
      });
      expect(fromA1.counterPartyId).to.equal('did:web:participant-a');
      expect(fromA1.counterPartyAddress).to.equal('https://a.example/dsp');
      expect(fromA1.assetId).to.equal(fromA1['@id']);
      expect(fromA1.datasetId).to.equal(fromA1['@id']);
    });

    it('falls back to catalog.originator for provider address when no dcat:service is present', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      const fromB = items.find(
        i => i['@id'] === 'urn:uuid:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
      );
      expect(fromB.provider).to.deep.equal({
        '@id': 'did:web:participant-b',
        name: 'did:web:participant-b',
        address: 'https://b.example/dsp',
      });
    });

    it('reads title/description/keywords/version from a nested dcat:service when the dataset has no top-level metadata', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      const fromA2 = items.find(
        i => i['@id'] === 'urn:uuid:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
      );
      expect(fromA2.name).to.equal('A - Dataset two (from nested service)');
      expect(fromA2.description).to.equal('Nested-service metadata dataset');
      // Scalar 'dcat:keyword' should be wrapped into an array.
      expect(fromA2.keywords).to.deep.equal(['beta']);
      expect(fromA2.version).to.equal('0.9.0');
    });

    it('tags every mapped item with @type ["tems:Object"]', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      for (const item of items) {
        expect(item['@type']).to.deep.equal(['tems:Object']);
      }
    });

    it('filters by args["rdf-type"] and threads the type into the container @id', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });
      const matching = await store.getData({ 'rdf-type': 'tems:Object' });
      expect(matching['@id']).to.equal(
        `store://local.${mockConfig.endpoint}.tems:Object`,
      );
      expect(matching['ldp:contains']).to.be.an('array').with.length(3);

      const otherStore = new FederatedCatalogueDcpStore({ ...mockConfig });
      withFakeApi(otherStore, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });
      const filtered = await otherStore.getData({
        'rdf-type': 'no:such:type',
      });
      expect(filtered['ldp:contains']).to.be.an('array').with.length(0);
    });

    it('re-entrancy: two concurrent calls share the same pending promise', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      let apiCalls = 0;
      withFakeApi(store, {
        getAggregatedCatalog: () => {
          apiCalls += 1;
          return new Promise(resolve =>
            setTimeout(() => resolve(buildDcpFixture()), 10),
          );
        },
      });

      const [a, b] = await Promise.all([store.getData({}), store.getData({})]);
      expect(a).to.equal(b);
      expect(apiCalls).to.equal(1);
    });

    it('returns an empty container (no throw) when the API throws', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () =>
          Promise.reject(new Error('backend on fire')),
      });

      const container = await store.getData({});
      expect(container).to.exist;
      expect(container['@type']).to.equal('ldp:Container');
      expect(container['ldp:contains']).to.be.an('array').with.length(0);
    });

    it('dispatches "resoureReady" with the container payload', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });

      const seen: any[] = [];
      const handler = (e: any) => seen.push(e.detail);
      document.addEventListener('resoureReady', handler);
      try {
        await store.getData({});
      } finally {
        document.removeEventListener('resoureReady', handler);
      }
      // At least one dispatch for the container itself.
      const containerEvent = seen.find(
        d =>
          typeof d?.id === 'string' &&
          d.id === `store://local.${mockConfig.endpoint}.default`,
      );
      expect(containerEvent, 'expected container dispatch').to.exist;
      expect(containerEvent.resource['@type']).to.equal('ldp:Container');
    });
  });

  describe('getData — v0.2.0 mapping (rdf:type, publisher, self-filter)', () => {
    const buildV02Fixture = (): DcpCatalog[] => [
      {
        '@id': 'urn:cat:v02-a',
        '@type': 'dcat:Catalog',
        'dspace:participantId': 'did:web:host.docker.internal%3A8080',
        originator: 'https://a.example/dsp',
        'dcat:dataset': [
          {
            // Full v0.2.0 DataService entry.
            '@id': 'urn:uuid:11111111-1111-4111-8111-111111111111',
            '@type': 'dcat:Dataset',
            'rdf:type': 'dcat:DataService',
            'dcterms:title': 'AFP Photo Search',
            'dcterms:description': 'Search over the AFP photo archive.',
            'dcat:keyword': ['Images', 'Search'],
            'dcterms:publisher': {
              '@id': 'did:web:host.docker.internal%3A8080',
              'foaf:name': 'Agence France-Presse',
              'foaf:depiction': { '@id': 'https://picsum.photos/seed/afp/128' },
            },
            'dcat:theme': [
              { '@id': 'http://publications.europa.eu/resource/authority/data-theme/GOVE' },
            ],
            'dcterms:language': [
              { '@id': 'http://publications.europa.eu/resource/authority/language/ENG' },
            ],
            'dcterms:issued': '2026-01-22',
            'tc:hostingCountry': 'be',
            'foaf:depiction': { '@id': 'https://picsum.photos/seed/afp-photo/400' },
            'dcat:endpointURL': { '@id': 'https://api.afp.example/photos/v1/search' },
            'dcat:endpointDescription': { '@id': 'https://api.afp.example/photos/v1/openapi.yaml' },
            'odrl:hasPolicy': { '@id': 'urn:policy:afp' },
          },
          {
            // Full v0.2.0 Dataset entry with a distribution.
            '@id': 'urn:uuid:44444444-4444-4444-8444-444444444444',
            '@type': 'dcat:Dataset',
            'rdf:type': { '@id': 'dcat:Dataset' },
            'dcterms:title': 'DW Fact-Check Registry',
            'dcterms:description': 'Public claims fact-checked by Deutsche Welle.',
            'dcat:keyword': 'Fact-check',
            'dcterms:publisher': {
              '@id': 'did:web:host.docker.internal%3A8080',
              'foaf:name': 'Agence France-Presse',
            },
            'dcat:distribution': [
              {
                'dcat:accessURL': { '@id': 'https://data.dw.example/registry.parquet' },
                'dcat:byteSize': 104857600,
              },
            ],
            'tc:hostingCountry': 'ES',
          } as unknown as DcpDataset,
        ],
      },
      {
        '@id': 'urn:cat:v02-b',
        '@type': 'dcat:Catalog',
        'dspace:participantId': 'did:web:host.docker.internal%3A8081',
        originator: 'https://b.example/dsp',
        'dcat:dataset': {
          '@id': 'urn:uuid:22222222-2222-4222-8222-222222222222',
          '@type': 'dcat:Dataset',
          'rdf:type': 'dcat:DataService',
          'dcterms:title': 'DW Live Stream',
          'dcat:endpointURL': { '@id': 'https://stream.dw.example/hls/master.m3u8' },
        } as DcpDataset,
      },
    ];

    it('appends tems:Service to @type when rdf:type is dcat:DataService', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildV02Fixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      const svc = items.find(
        i => i['@id'] === 'urn:uuid:11111111-1111-4111-8111-111111111111',
      );
      expect(svc['@type']).to.include('tems:Object');
      expect(svc['@type']).to.include('tems:Service');
      expect(svc['@type']).to.not.include('tems:DataOffer');
    });

    it('appends tems:DataOffer to @type when rdf:type is dcat:Dataset (object form)', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildV02Fixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      const ds = items.find(
        i => i['@id'] === 'urn:uuid:44444444-4444-4444-8444-444444444444',
      );
      expect(ds['@type']).to.include('tems:Object');
      expect(ds['@type']).to.include('tems:DataOffer');
      expect(ds['@type']).to.not.include('tems:Service');
    });

    it('keeps @type = [tems:Object] only when rdf:type is absent (back-compat)', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      for (const item of items) {
        expect(item['@type']).to.deep.equal(['tems:Object']);
      }
    });

    it('uses dcterms:publisher.foaf:name for provider.name and foaf:depiction for logoUrl', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildV02Fixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      const svc = items.find(
        i => i['@id'] === 'urn:uuid:11111111-1111-4111-8111-111111111111',
      );
      expect(svc.provider.name).to.equal('Agence France-Presse');
      expect(svc.provider.logoUrl).to.equal('https://picsum.photos/seed/afp/128');
      // counterPartyId still tracks the publisher DID for negotiation.
      expect(svc.counterPartyId).to.equal('did:web:host.docker.internal%3A8080');
    });

    it('pushes dataset-level foaf:depiction into images[] and bannerUrl', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildV02Fixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      const svc = items.find(
        i => i['@id'] === 'urn:uuid:11111111-1111-4111-8111-111111111111',
      );
      expect(svc.images).to.deep.equal(['https://picsum.photos/seed/afp-photo/400']);
      expect(svc.bannerUrl).to.equal('https://picsum.photos/seed/afp-photo/400');
    });

    it('passes through v0.2.0 fields: themes, languages, hostingCountry (uppercased), distributions, endpointUrl', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildV02Fixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      const svc = items.find(
        i => i['@id'] === 'urn:uuid:11111111-1111-4111-8111-111111111111',
      );
      expect(svc.themes).to.deep.equal([
        { uri: 'http://publications.europa.eu/resource/authority/data-theme/GOVE' },
      ]);
      expect(svc.languages).to.deep.equal([
        { uri: 'http://publications.europa.eu/resource/authority/language/ENG' },
      ]);
      expect(svc.hostingCountry).to.equal('BE');
      expect(svc.endpointUrl).to.equal('https://api.afp.example/photos/v1/search');
      expect(svc.endpointDescription).to.equal('https://api.afp.example/photos/v1/openapi.yaml');
      expect(svc.rdfType).to.equal('dcat:DataService');
      expect(svc.issued).to.equal('2026-01-22');

      const ds = items.find(
        i => i['@id'] === 'urn:uuid:44444444-4444-4444-8444-444444444444',
      );
      expect(ds.distributions).to.deep.equal([
        {
          accessUrl: 'https://data.dw.example/registry.parquet',
          byteSize: 104857600,
        },
      ]);
      expect(ds.hostingCountry).to.equal('ES');
    });

    it('skips catalogs whose participantId matches ownParticipantId (case-insensitive)', async () => {
      const store = new FederatedCatalogueDcpStore({
        ...mockConfig,
        ownParticipantId: 'DID:WEB:HOST.docker.internal%3A8080', // upper-case on purpose
      });
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildV02Fixture()),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      // participant-a's 2 datasets are filtered; only participant-b's DW stream remains.
      expect(items).to.have.length(1);
      expect(items[0]['@id']).to.equal(
        'urn:uuid:22222222-2222-4222-8222-222222222222',
      );
    });

    it('normalizes expanded-URI DSP payloads (rdf:type, tc:*, foaf:*, dct:*)', async () => {
      // Real-world shape: EDC connectors emit our custom-vocab fields under
      // expanded URIs whenever their DSP @context lacks the prefix.
      const expandedFixture: DcpCatalog[] = [
        {
          '@id': 'urn:cat:exp',
          '@type': 'dcat:Catalog',
          'dspace:participantId': 'did:web:host.docker.internal%3A8080',
          'dcat:dataset': [
            {
              '@id': 'urn:uuid:99999999-9999-4999-8999-999999999999',
              '@type': 'dcat:Dataset',
              'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'dcat:DataService',
              'dct:title': 'Expanded-form AFP Service',
              'dct:description': 'Emitted with dct: alias, not dcterms:',
              'dct:publisher': {
                '@id': 'did:web:host.docker.internal%3A8080',
                'http://xmlns.com/foaf/0.1/name': 'Agence France-Presse',
              },
              'http://tems.org/2024/temscore#hostingCountry': 'FR',
              'http://xmlns.com/foaf/0.1/depiction': {
                '@id': 'https://picsum.photos/seed/exp/400',
              },
            } as unknown as DcpDataset,
          ],
        },
      ];
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(expandedFixture),
      });
      const container = await store.getData({});
      const items = container['ldp:contains'] as any[];
      const one = items[0];
      // rdf:type expanded → tems:Service on @type.
      expect(one['@type']).to.include('tems:Service');
      // dct:title → name.
      expect(one.name).to.equal('Expanded-form AFP Service');
      // dct:description → description.
      expect(one.description).to.equal('Emitted with dct: alias, not dcterms:');
      // dct:publisher + expanded foaf:name → provider.name.
      expect(one.provider.name).to.equal('Agence France-Presse');
      // Expanded tc:hostingCountry uppercased.
      expect(one.hostingCountry).to.equal('FR');
      // Expanded foaf:depiction → bannerUrl + images.
      expect(one.bannerUrl).to.equal('https://picsum.photos/seed/exp/400');
      expect(one.images).to.deep.equal(['https://picsum.photos/seed/exp/400']);
    });

    it('does not filter when ownParticipantId is unset (default)', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildV02Fixture()),
      });
      const container = await store.getData({});
      expect((container['ldp:contains'] as any[]).length).to.equal(3);
    });
  });

  describe('get (cache lookup after getData)', () => {
    it('resolves cached items by their @id after a successful getData', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      withFakeApi(store, {
        getAggregatedCatalog: () => Promise.resolve(buildDcpFixture()),
      });
      await store.getData({});

      const cached = await store.get(
        'urn:uuid:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      );
      expect(cached).to.exist;
      expect(cached).to.have.property(
        '@id',
        'urn:uuid:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      );
      expect(cached).to.have.property('name', 'A - Dataset one');
    });

    it('returns null for an unknown id', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      expect(await store.get('urn:uuid:nope')).to.be.null;
    });

    it('handles a cache read error gracefully (returns null)', async () => {
      const store = new FederatedCatalogueDcpStore(mockConfig);
      cy.stub(store.cache, 'get').throws(new Error('cache boom'));
      const result = await store.get('anything');
      expect(result).to.be.null;
    });
  });
});
