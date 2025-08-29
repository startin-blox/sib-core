// Mock EDC API responses
const mockAssets = [
  {
    '@id': 'test-asset-1',
    '@type': 'edc:Asset',
    'dcterms:title': 'Test Asset 1',
    'dcterms:description': 'Test asset for unit testing',
    properties: { 'https://w3id.org/edc/v0.0.1/ns/type': 'data' }
  },
  {
    '@id': 'test-asset-2',
    '@type': 'edc:Asset', 
    'dcterms:title': 'Test Asset 2',
    properties: { 'https://w3id.org/edc/v0.0.1/ns/type': 'data' }
  }
];

const mockPolicies = [
  {
    '@id': 'test-policy-1',
    '@type': 'PolicyDefinition',
    policy: {
      '@type': 'Set',
      permission: [{ '@type': 'Permission', action: 'USE' }]
    },
    createdAt: 1640995200000
  }
];

const mockContracts = [
  {
    '@id': 'test-contract-1', 
    '@type': 'ContractDefinition',
    accessPolicyId: 'test-policy-1',
    contractPolicyId: 'test-policy-1',
    assetsSelector: [],
    createdAt: 1640995200000
  }
];

const mockCatalog = {
  '@context': { '@vocab': 'https://w3id.org/edc/v0.0.1/ns/' },
  '@type': 'Catalog',
  '@id': 'test-catalog-1',
  participantId: 'test-provider',
  'dcat:dataset': [
    {
      '@type': 'dcat:Dataset',
      '@id': 'test-dataset-1',
      'dcterms:title': 'Test Dataset from Catalog'
    }
  ]
};

describe('DataspaceConnectorStore', { testIsolation: false }, function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/dataspace-connector-store.html');
  });

  it('has store prototype and methods', () => {
    cy.window().its('edcStore').should('exist').then((edcStore: any) => {
      expect(edcStore).to.exist;
      expect(edcStore.cache).to.exist;
      expect(edcStore.cache.constructor.name).to.equal('InMemoryCacheManager');
      
      // Check EDC-specific methods
      expect(edcStore.getCatalog).to.be.a('function');
      expect(edcStore.getAssets).to.be.a('function');
      expect(edcStore.getPolicyDefinitions).to.be.a('function');
      expect(edcStore.getContractDefinitions).to.be.a('function');
      
      // Check IStore interface compliance
      expect(edcStore.get).to.be.a('function');
      expect(edcStore.getData).to.be.a('function');
    });
  });

  it('fetches and caches assets', () => {
    cy.intercept('POST', '**/v3/assets/request', {
      statusCode: 200,
      body: mockAssets,
      headers: { 'content-type': 'application/json' }
    }).as('edcAssets');

    cy.window().then(async (win: any) => {
      const store = win.edcStore;
      
      const assets = await store.getAssets();
      expect(assets).to.be.an('array');
      expect(assets.length).to.equal(2);
      
      // Verify caching
      const cached1 = await store.cache.get('test-asset-1');
      const cached2 = await store.cache.get('test-asset-2');
      expect(cached1).to.exist;
      expect(cached2).to.exist;
      expect(cached1['dcterms:title']).to.equal('Test Asset 1');
    });

    cy.get('@edcAssets').should((interception: any) => {
      expect(interception.request.method).to.equal('POST');
      expect(interception.request.body).to.have.property('@type', 'QuerySpec');
    });
  });

  it('fetches and caches policy definitions', () => {
    cy.intercept('POST', '**/v3/policydefinitions/request', {
      statusCode: 200,
      body: mockPolicies,
      headers: { 'content-type': 'application/json' }
    }).as('edcPolicies');

    cy.window().then(async (win: any) => {
      const store = win.edcStore;
      
      const policies = await store.getPolicyDefinitions();
      expect(policies).to.be.an('array');
      expect(policies.length).to.equal(1);
      
      // Verify caching
      const cachedPolicy = await store.cache.get('test-policy-1');
      expect(cachedPolicy).to.exist;
      expect(cachedPolicy['@type']).to.equal('PolicyDefinition');
    });
  });

  it('fetches and caches contract definitions', () => {
    cy.intercept('POST', '**/v3/contractdefinitions/request', {
      statusCode: 200,
      body: mockContracts,
      headers: { 'content-type': 'application/json' }
    }).as('edcContracts');

    cy.window().then(async (win: any) => {
      const store = win.edcStore;
      
      const contracts = await store.getContractDefinitions();
      expect(contracts).to.be.an('array');
      expect(contracts.length).to.equal(1);
      
      // Verify caching
      const cachedContract = await store.cache.get('test-contract-1');
      expect(cachedContract).to.exist;
      expect(cachedContract.accessPolicyId).to.equal('test-policy-1');
    });
  });

  it('fetches catalog and caches datasets', () => {
    cy.intercept('POST', '**/v3/catalog/request', {
      statusCode: 200,
      body: mockCatalog,
      headers: { 'content-type': 'application/json' }
    }).as('edcCatalog');

    cy.window().then(async (win: any) => {
      const store = win.edcStore;
      
      const catalog = await store.getCatalog('https://provider.example.com/protocol');
      expect(catalog).to.exist;
      expect(catalog['@id']).to.equal('test-catalog-1');
      
      // Verify catalog and dataset caching
      const cachedCatalog = await store.cache.get('test-catalog-1');
      const cachedDataset = await store.cache.get('test-dataset-1');
      expect(cachedCatalog).to.exist;
      expect(cachedDataset).to.exist;
    });
  });

  it('retrieves cached resources by ID', () => {
    cy.window().then(async (win: any) => {
      const store = win.edcStore;
      
      // Should be able to get previously cached assets
      const asset = await store.cache.get('test-asset-1');
      expect(asset).to.exist;
      expect(asset['@id']).to.equal('test-asset-1');
      expect(asset['dcterms:title']).to.equal('Test Asset 1');
      
      // Check cache length
      const cacheLength = await store.cache.length();
      expect(cacheLength).to.be.greaterThan(0);
    });
  });

  it('handles authentication headers', () => {
    cy.window().then((win: any) => {
      const store = win.edcStore;
      expect(store.headers).to.have.property('X-Api-Key');
      expect(store.headers).to.have.property('Content-Type', 'application/json');
    });
  });

  it('builds v3 QuerySpec correctly', () => {
    cy.window().then((win: any) => {
      const store = win.edcStore;
      
      const querySpec = store.buildV3QuerySpec();
      expect(querySpec).to.have.property('@context');
      expect(querySpec).to.have.property('@type', 'QuerySpec');
      expect(querySpec).to.have.property('offset', 0);
      expect(querySpec).to.have.property('limit', 50);
    });
  });

  it('clears cache correctly', () => {
    cy.window().then(async (win: any) => {
      const store = win.edcStore;
      
      // Verify cache has items
      const initialLength = await store.cache.length();
      expect(initialLength).to.be.greaterThan(0);
      
      // Clear cache
      await store.cache.clear();
      
      // Verify cache is empty
      const finalLength = await store.cache.length();
      expect(finalLength).to.equal(0);
      
      // Verify specific items are gone
      const asset = await store.cache.get('test-asset-1');
      expect(asset).to.be.undefined;
    });
  });
});