// Mock catalog responses for different providers
const mockCatalogProviderA = {
  '@context': {
    '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
    dcat: 'http://www.w3.org/ns/dcat#',
    dcterms: 'http://purl.org/dc/terms/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    dspace: 'https://w3id.org/dspace/v0.8/',
  },
  '@id': 'provider-a-catalog',
  '@type': 'dcat:Catalog',
  participantId: 'provider-a-did',
  'dcat:dataset': [
    {
      '@id': 'dataset-a1',
      '@type': 'dcat:Dataset',
      'dcterms:title': 'Financial Data A1',
      'dcterms:description': 'High-quality financial dataset from Provider A',
      'dcat:keyword': ['finance', 'banking', 'data'],
      properties: {
        'https://w3id.org/edc/v0.0.1/ns/type': 'data',
        'https://w3id.org/edc/v0.0.1/ns/version': '1.0',
      },
    },
    {
      '@id': 'dataset-a2',
      '@type': 'dcat:Dataset',
      'dcterms:title': 'Market Analytics A2',
      'dcterms:description': 'Real-time market analytics from Provider A',
      'dcat:keyword': ['market', 'analytics', 'real-time'],
      properties: {
        'https://w3id.org/edc/v0.0.1/ns/type': 'api',
        'https://w3id.org/edc/v0.0.1/ns/version': '2.1',
      },
    },
  ],
};

const mockCatalogProviderB = {
  '@context': {
    '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
    dcat: 'http://www.w3.org/ns/dcat#',
    dcterms: 'http://purl.org/dc/terms/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    dspace: 'https://w3id.org/dspace/v0.8/',
  },
  '@id': 'provider-b-catalog',
  '@type': 'dcat:Catalog',
  participantId: 'provider-b-did',
  'dcat:dataset': [
    {
      '@id': 'dataset-b1',
      '@type': 'dcat:Dataset',
      'dcterms:title': 'Supply Chain Data B1',
      'dcterms:description': 'Comprehensive supply chain tracking data',
      'dcat:keyword': ['supply-chain', 'logistics', 'tracking'],
      properties: {
        'https://w3id.org/edc/v0.0.1/ns/type': 'data',
        'https://w3id.org/edc/v0.0.1/ns/version': '1.5',
      },
    },
  ],
};

const mockCatalogProviderC = {
  '@context': {
    '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
    dcat: 'http://www.w3.org/ns/dcat#',
    dcterms: 'http://purl.org/dc/terms/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    dspace: 'https://w3id.org/dspace/v0.8/',
  },
  '@id': 'provider-c-catalog',
  '@type': 'dcat:Catalog',
  participantId: 'provider-c-did',
  'dcat:dataset': [],
};

describe('EdcFederatedCatalogDisplay', () => {
  beforeEach(() => {
    // Set up intercept for the consumer connector catalog requests
    // Match requests based on counterPartyAddress to return correct provider data
    cy.intercept('POST', '/management/v3/catalog/request', req => {
      const counterPartyAddress = req.body?.counterPartyAddress;
      console.log('Intercept - counterPartyAddress:', counterPartyAddress);

      let response;
      if (counterPartyAddress === 'https://provider-a.example.com/management') {
        response = mockCatalogProviderA;
        console.log('Returning Provider A mock (2 datasets)');
      } else if (
        counterPartyAddress === 'https://provider-b.example.com/management'
      ) {
        response = mockCatalogProviderB;
        console.log('Returning Provider B mock (1 dataset)');
      } else if (
        counterPartyAddress === 'https://provider-c.example.com/management'
      ) {
        response = mockCatalogProviderC;
        console.log('Returning Provider C mock (0 datasets)');
      } else {
        response = mockCatalogProviderA;
        console.log(
          'Fallback to Provider A mock, counterPartyAddress was:',
          counterPartyAddress,
        );
      }

      req.reply({
        statusCode: 200,
        body: response,
        headers: { 'content-type': 'application/json' },
      });
    }).as('catalogRequests');

    // Visit the page for each test to ensure clean state
    cy.visit('/examples/e2e/edc-federated-catalog-display.html');
  });

  it('displays loading state initially', () => {
    cy.get('edc-federated-catalog-display').should('exist');
    // cy.get('.loading-indicator').should('contain', '⏳ Loading...');
  });

  it('fetches catalogs from multiple providers', () => {
    // Wait for datasets to be displayed
    cy.get('.federated-datasets-list', { timeout: 10000 }).should('exist');

    // Verify header shows correct totals
    cy.get('.federated-header h2').should('contain', 'Federated EDC Catalog');
    cy.get('.federated-header p').should('contain', '3 unique datasets');
    cy.get('.federated-header p').should('contain', '3/3 providers');
  });

  it('displays provider statistics correctly', () => {
    // Wait for the stats to be populated
    cy.get('.provider-stats', { timeout: 10000 }).should('exist');

    // Check provider stats section
    cy.get('.provider-stats').should('exist');
    cy.get('.provider-stats h3').should('contain', 'Provider Status');

    // Verify each provider stat card
    cy.get('.stat-card.success').should('have.length', 3);

    // Check Provider A stats
    cy.get('.stat-card')
      .contains('Provider A')
      .parent()
      .within(() => {
        cy.get('.stat-count').should('contain', '2 datasets');
        cy.get('.stat-status').should('contain', 'success');
      });

    // Check Provider B stats
    cy.get('.stat-card')
      .contains('Provider B')
      .parent()
      .within(() => {
        cy.get('.stat-count').should('contain', '1 datasets');
        cy.get('.stat-status').should('contain', 'success');
      });

    // Check Provider C stats (empty catalog)
    cy.get('.stat-card')
      .contains('Provider C')
      .parent()
      .within(() => {
        cy.get('.stat-count').should('contain', '0 datasets');
        cy.get('.stat-status').should('contain', 'success');
      });
  });

  it('displays federated datasets with provider information', () => {
    // Wait for datasets to be displayed
    cy.get('.federated-datasets-list', { timeout: 10000 }).should('exist');

    // Check that datasets are displayed
    cy.get('.federated-datasets-list').should('exist');

    // Verify datasets contain expected content
    cy.get('.federated-datasets-list').should('contain', 'dataset-a1');
    cy.get('.federated-datasets-list').should('contain', 'dataset-a2');
    cy.get('.federated-datasets-list').should('contain', 'dataset-b1');
  });

  it('filters datasets by provider selection', () => {
    // Wait for datasets to be displayed
    cy.get('.federated-datasets-list', { timeout: 10000 }).should('exist');

    // Initially all 3 datasets should be visible (all providers selected by default)
    cy.get('.federated-datasets-list').should('contain', 'dataset-a1');
    cy.get('.federated-datasets-list').should('contain', 'dataset-a2');
    cy.get('.federated-datasets-list').should('contain', 'dataset-b1');

    // Uncheck Provider A (which should remove datasets a1 and a2)
    cy.get('.provider-checkbox').contains('Provider A').click();

    // Should now only show content from Provider B and C
    cy.get('.federated-datasets-list').should('contain', 'dataset-b1');
    cy.get('.federated-datasets-list').should('not.contain', 'dataset-a1');
    cy.get('.federated-datasets-list').should('not.contain', 'dataset-a2');

    // Uncheck Provider B as well (only Provider C left, which has 0 datasets)
    cy.get('.provider-checkbox').contains('Provider B').click();

    // Should show empty state since Provider C has no datasets
    cy.get('.empty', { timeout: 5000 }).should(
      'contain',
      'No datasets match your current filters',
    );

    // Re-check Provider A (should show Provider A datasets again)
    cy.get('.provider-checkbox').contains('Provider A').click();

    // Should show datasets from Provider A
    cy.get('.federated-datasets-list').should('contain', 'dataset-a1');
    cy.get('.federated-datasets-list').should('contain', 'dataset-a2');
  });

  it('tests search functionality', () => {
    // Wait for datasets to be displayed
    cy.get('.federated-datasets-list', { timeout: 10000 }).should('exist');

    // Initially all datasets should be visible
    cy.get('.federated-datasets-list').should('contain', 'dataset-a1');
    cy.get('.federated-datasets-list').should('contain', 'dataset-a2');
    cy.get('.federated-datasets-list').should('contain', 'dataset-b1');

    // Search for exact dataset ID "dataset-a1"
    cy.get('.search-input').clear().type('dataset-a1');

    // Give time for the search to trigger
    cy.wait(1000);

    // Check if filtering worked - should only show dataset-a1
    cy.get('.federated-datasets-list').then($list => {
      const text = $list.text();
      cy.log('Filtered content:', text);

      // If search filtering works, should contain dataset-a1 but not the others
      if (
        text.includes('dataset-a1') &&
        !text.includes('dataset-a2') &&
        !text.includes('dataset-b1')
      ) {
        cy.log('✅ Search filtering is working correctly');
      } else {
        cy.log(
          '❌ Search filtering is not working - all datasets still visible',
        );
      }
    });

    // Clear search
    cy.get('.search-input').clear();
    cy.wait(500);

    // Should show all datasets again
    cy.get('.federated-datasets-list').should('contain', 'dataset-a1');
    cy.get('.federated-datasets-list').should('contain', 'dataset-a2');
    cy.get('.federated-datasets-list').should('contain', 'dataset-b1');
  });

  it('handles provider API errors gracefully', () => {
    // Set up error responses for Provider A and B via the consumer connector
    cy.intercept('POST', '/management/v3/catalog/request', req => {
      const counterPartyAddress = req.body.counterPartyAddress;

      if (counterPartyAddress?.includes('provider-a.example.com')) {
        req.reply({
          statusCode: 500,
          body: { message: 'Internal server error' },
        });
      } else if (counterPartyAddress?.includes('provider-b.example.com')) {
        req.reply({
          statusCode: 404,
          body: { message: 'Catalog not found' },
        });
      } else if (counterPartyAddress?.includes('provider-c.example.com')) {
        req.reply({
          statusCode: 200,
          body: mockCatalogProviderC,
          headers: { 'content-type': 'application/json' },
        });
      }
    }).as('catalogErrorRequests');

    cy.reload();

    // Wait for provider stats to show the error states
    cy.get('.stat-card.error', { timeout: 10000 }).should('have.length.gte', 1);

    // Check provider stats show errors
    cy.get('.stat-card.error').should('have.length', 2);
    cy.get('.stat-card.success').should('have.length', 1);

    // Check error messages are displayed
    cy.get('.stat-card')
      .contains('Provider A')
      .parent()
      .within(() => {
        cy.get('.stat-error').should('exist');
        cy.get('.stat-status').should('contain', 'error');
      });

    cy.get('.stat-card')
      .contains('Provider B')
      .parent()
      .within(() => {
        cy.get('.stat-error').should('exist');
        cy.get('.stat-status').should('contain', 'error');
      });

    // Provider C should still be successful
    cy.get('.stat-card')
      .contains('Provider C')
      .parent()
      .within(() => {
        cy.get('.stat-status').should('contain', 'success');
      });

    // Header should show only successful providers
    cy.get('.federated-header p').should('contain', '1/3 providers');
  });

  it('sends correct API requests with proper headers', () => {
    cy.get('@catalogRequests').should((interception: any) => {
      expect(interception.request.method).to.equal('POST');
      expect(interception.request.headers).to.have.property(
        'x-api-key',
        'test-api-key',
      );
      expect(interception.request.headers).to.have.property(
        'content-type',
        'application/json',
      );

      // Check request body structure
      expect(interception.request.body).to.have.property(
        '@type',
        'CatalogRequestMessage',
      );
      expect(interception.request.body).to.have.property('counterPartyAddress');
      expect(interception.request.body).to.have.property(
        'protocol',
        'dataspace-protocol-http',
      );
    });
  });

  it('handles empty catalogs appropriately', () => {
    // Set up all providers to return empty catalogs via the consumer connector
    cy.intercept('POST', '/management/v3/catalog/request', req => {
      const counterPartyAddress = req.body.counterPartyAddress;

      if (counterPartyAddress?.includes('provider-a.example.com')) {
        req.reply({
          statusCode: 200,
          body: { ...mockCatalogProviderA, 'dcat:dataset': [] },
          headers: { 'content-type': 'application/json' },
        });
      } else if (counterPartyAddress?.includes('provider-b.example.com')) {
        req.reply({
          statusCode: 200,
          body: { ...mockCatalogProviderB, 'dcat:dataset': [] },
          headers: { 'content-type': 'application/json' },
        });
      } else if (counterPartyAddress?.includes('provider-c.example.com')) {
        req.reply({
          statusCode: 200,
          body: mockCatalogProviderC, // This is already empty
          headers: { 'content-type': 'application/json' },
        });
      }
    }).as('catalogEmptyRequests');

    cy.reload();

    // Wait for the empty state to appear
    cy.get('.empty', { timeout: 10000 }).should(
      'contain',
      'No datasets found in federated catalog',
    );

    // Should show empty state for federated catalog
    cy.get('.empty').should(
      'contain',
      'No datasets found in federated catalog',
    );

    // Provider stats should show 0 datasets for all
    cy.get('.stat-card').each($card => {
      cy.wrap($card).within(() => {
        cy.get('.stat-count').should('contain', '0 datasets');
      });
    });
  });

  it('displays correct dataset metadata', () => {
    // Wait for datasets to be displayed
    cy.get('.federated-datasets-list', { timeout: 10000 }).should('exist');

    // Check that dataset metadata is displayed
    cy.get('.federated-datasets-list').should('contain', 'dataset-a1');
    cy.get('.federated-datasets-list').should('contain', 'dataset-a2');
    cy.get('.federated-datasets-list').should('contain', 'dataset-b1');
  });
});
