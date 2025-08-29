const mockAssets = [
  {
    '@id': 'test-asset-1',
    '@type': 'edc:Asset',
    'dcterms:title': 'Test Dataset 1',
    'dcterms:description': 'A test dataset for e2e testing',
    properties: { 'https://w3id.org/edc/v0.0.1/ns/type': 'data' },
  },
  {
    '@id': 'test-asset-2',
    '@type': 'edc:Asset',
    'dcterms:title': 'Test Dataset 2',
    properties: { 'https://w3id.org/edc/v0.0.1/ns/type': 'service' },
  },
  {
    '@id': 'asset-without-title',
    '@type': 'edc:Asset',
    properties: { 'https://w3id.org/edc/v0.0.1/ns/type': 'data' },
  },
];

describe('EdcAssetsDisplay', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/edc-assets-display.html');
  });

  it('displays loading state initially', () => {
    cy.get('edc-assets-display').should('exist');
    cy.get('edc-assets-display .loading').should('contain', 'Loading assets...');
  });

  it('fetches and displays assets from EDC connector', () => {
    cy.intercept('POST', '**/v3/assets/request', {
      statusCode: 200,
      body: mockAssets,
      headers: { 'content-type': 'application/json' },
    }).as('edcAssets');

    // Wait for the component to load and make the request
    cy.wait('@edcAssets');

    // Verify assets are displayed
    cy.get('.edc-assets-list').should('exist');
    cy.get('.edc-asset-item').should('have.length', 3);

    // Check first asset
    cy.get('.edc-asset-item').first().within(() => {
      cy.get('.asset-title').should('contain', 'Test Dataset 1');
      cy.get('.asset-description').should('contain', 'A test dataset for e2e testing');
      cy.get('.asset-id').should('contain', 'ID: test-asset-1');
      cy.get('.asset-type').should('contain', 'Type: data');
    });

    // Check second asset
    cy.get('.edc-asset-item').eq(1).within(() => {
      cy.get('.asset-title').should('contain', 'Test Dataset 2');
      cy.get('.asset-type').should('contain', 'Type: service');
      cy.get('.asset-description').should('not.exist');
    });

    // Check asset without title (should show ID)
    cy.get('.edc-asset-item').eq(2).within(() => {
      cy.get('.asset-title').should('contain', 'asset-without-title');
      cy.get('.asset-id').should('contain', 'ID: asset-without-title');
    });
  });

  it('sends correct EDC v3 API request', () => {
    cy.get('@edcAssets').should((interception: any) => {
      expect(interception.request.method).to.equal('POST');
      expect(interception.request.headers).to.have.property('x-api-key', 'test-api-key');
      expect(interception.request.headers).to.have.property('content-type', 'application/json');
      expect(interception.request.body).to.have.property('@type', 'QuerySpec');
      expect(interception.request.body).to.have.property('offset', 0);
      expect(interception.request.body).to.have.property('limit', 50);
    });
  });

  it('handles API errors gracefully', () => {
    cy.intercept('POST', '**/v3/assets/request', {
      statusCode: 500,
      body: { message: 'Internal server error' },
    }).as('edcAssetsError');

    cy.reload();
    cy.wait('@edcAssetsError');

    cy.get('.error').should('contain', 'Error:');
    cy.get('.edc-assets-list').should('not.exist');
  });

  it('displays empty state when no assets returned', () => {
    cy.intercept('POST', '**/v3/assets/request', {
      statusCode: 200,
      body: [],
      headers: { 'content-type': 'application/json' },
    }).as('edcAssetsEmpty');

    cy.reload();
    cy.wait('@edcAssetsEmpty');

    cy.get('.empty').should('contain', 'No assets found');
    cy.get('.edc-assets-list').should('not.exist');
  });

  it('has correct asset data attributes', () => {
    cy.intercept('POST', '**/v3/assets/request', {
      statusCode: 200,
      body: mockAssets,
      headers: { 'content-type': 'application/json' },
    }).as('edcAssetsData');

    cy.reload();
    cy.wait('@edcAssetsData');

    cy.get('.edc-asset-item[data-asset-id="test-asset-1"]').should('exist');
    cy.get('.edc-asset-item[data-asset-id="test-asset-2"]').should('exist');
    cy.get('.edc-asset-item[data-asset-id="asset-without-title"]').should('exist');
  });
});