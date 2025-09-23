
describe('EdcAssetsDisplay', () => {
  beforeEach(() => {
    // Set up default intercept for EDC assets endpoint
    cy.intercept('POST', '**/management/v3/assets/request', {
      fixture: 'edc-assets.json',
      headers: { 'content-type': 'application/json' },
    }).as('defaultEdcAssets');

    // Visit the test page
    cy.visit('/examples/e2e/edc-assets-display.html');
  });

  it('displays loading state initially', () => {
    cy.get('edc-assets-display').should('exist');
    cy.get('edc-assets-display .loading').should(
      'contain',
      'Loading assets...',
    );
  });

  it('fetches and displays assets from EDC connector', () => {
    cy.intercept('POST', '**/management/v3/assets/request', {
      fixture: 'edc-assets.json',
      headers: { 'content-type': 'application/json' },
    }).as('edcAssets');

    // Wait for assets to be displayed
    cy.get('.edc-assets-list', { timeout: 10000 }).should('be.visible');
    cy.get('.edc-asset-item').should('have.length', 3);

    // Check first asset
    cy.get('.edc-asset-item')
      .first()
      .within(() => {
        cy.get('.asset-title').should('contain', 'Test Dataset 1');
        cy.get('.asset-description').should(
          'contain',
          'A test dataset for e2e testing',
        );
        cy.get('.asset-id').should('contain', 'ID: test-asset-1');
        cy.get('.asset-type').should('contain', 'Type: data');
      });

    // Check second asset
    cy.get('.edc-asset-item')
      .eq(1)
      .within(() => {
        cy.get('.asset-title').should('contain', 'Test Dataset 2');
        cy.get('.asset-type').should('contain', 'Type: service');
        cy.get('.asset-description').should('not.exist');
      });

    // Check asset without title (should show ID)
    cy.get('.edc-asset-item')
      .eq(2)
      .within(() => {
        cy.get('.asset-title').should('contain', 'asset-without-title');
        cy.get('.asset-id').should('contain', 'ID: asset-without-title');
      });
  });

  it('sends correct EDC v3 API request', () => {
    let requestCapture: any;

    cy.intercept('POST', '**/management/v3/assets/request', (req) => {
      requestCapture = req;
      req.reply({
        fixture: 'edc-assets.json',
        headers: { 'content-type': 'application/json' },
      });
    }).as('edcAssets');

    cy.reload();

    // Wait for request to be made and validate structure
    cy.then(() => {
      expect(requestCapture).to.not.be.undefined;
      expect(requestCapture.method).to.equal('POST');
      expect(requestCapture.headers).to.have.property('x-api-key', 'test-api-key');
      expect(requestCapture.headers).to.have.property('content-type', 'application/json');

      // Verify QuerySpec structure
      const body = requestCapture.body;
      expect(body).to.have.property('@type', 'QuerySpec');
      expect(body).to.have.property('offset', 0);
      expect(body).to.have.property('limit', 50);
      expect(body).to.have.property('filterExpression').that.is.an('array');
      expect(body).to.have.property('sortField', null);
      expect(body).to.have.property('sortOrder', 'ASC');

      // Verify @context
      expect(body).to.have.property('@context');
      expect(body['@context']).to.have.property('@vocab', 'https://w3id.org/edc/v0.0.1/ns/');
      expect(body['@context']).to.have.property('edc', 'https://w3id.org/edc/v0.0.1/ns/');
    });
  });

  it('handles API errors gracefully', () => {
    cy.intercept('POST', '**/management/v3/assets/request', {
      statusCode: 500,
      fixture: 'edc-error.json',
    }).as('edcAssetsError');

    cy.reload();

    // The component shows empty state when API fails (rather than error state)
    cy.get('.empty', { timeout: 10000 }).should('be.visible').and('contain', 'No assets found');
    cy.get('.edc-assets-list').should('not.exist');
  });

  it('displays empty state when no assets returned', () => {
    cy.intercept('POST', '**/management/v3/assets/request', {
      fixture: 'edc-assets-empty.json',
      headers: { 'content-type': 'application/json' },
    }).as('edcAssetsEmpty');

    cy.reload();

    cy.get('.empty', { timeout: 10000 }).should('be.visible').and('contain', 'No assets found');
    cy.get('.edc-assets-list').should('not.exist');
  });

  it('has correct asset data attributes', () => {
    cy.intercept('POST', '**/management/v3/assets/request', {
      fixture: 'edc-assets.json',
      headers: { 'content-type': 'application/json' },
    }).as('edcAssetsData');

    cy.reload();

    cy.get('.edc-asset-item[data-asset-id="test-asset-1"]', { timeout: 10000 }).should('exist');
    cy.get('.edc-asset-item[data-asset-id="test-asset-2"]').should('exist');
    cy.get('.edc-asset-item[data-asset-id="asset-without-title"]').should('exist');
  });
});
