describe('Solid Display Catalog Example', () => {
  beforeEach(() => {
    cy.visit('/examples/e2e/dcat-catalog.html');
  });

  it('should load the solid-display component', () => {
    cy.get('solid-display#test-1')
      .should('exist')
      .and(
        'have.attr',
        'data-src',
        '/examples/data/catalog/e2e/dcat-catalog.jsonld',
      );
  });

  it('should display two datasets correctly', () => {
    cy.get('solid-display#test-1').within(() => {
      cy.get('solid-display').filter(':visible').should('have.length', 2);

      cy.get('solid-display')
        .eq(0)
        .within(() => {
          cy.contains('urn:dev3-trial8-object').should('exist');
          cy.contains(
            'This asset requires Membership to view and negotiate.',
          ).should('exist');
          cy.contains(
            'https://api.tems-dev3.startinblox.com/indexes/objects/trial8/index',
          ).should('exist');
        });

      cy.get('solid-display')
        .eq(1)
        .within(() => {
          cy.contains('urn:dev3-trial6-object').should('exist');
          cy.contains(
            'This asset requires Membership to view and SensitiveData credential to negotiate.',
          ).should('exist');
          cy.contains(
            'https://api.tems-dev3.startinblox.com/indexes/objects/trial6/index',
          ).should('exist');
        });
    });
  });
});
