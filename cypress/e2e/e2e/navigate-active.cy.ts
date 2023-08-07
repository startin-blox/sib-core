describe('uses active on navigate', function () {
  beforeEach('visit', () => {
    cy.visit('/examples/e2e/active-navigate.html')
  });

  it('set active by default', () => {
    cy.get('solid-display[data-src="user-2.jsonld"]').should('exist').and('have.attr', 'active');
    cy.get('solid-display[data-src="user-1.jsonld"]').should('exist').and('not.have.attr', 'active');
    cy.get('solid-display[data-src="user-3.jsonld"]').should('exist').and('not.have.attr', 'active');
    cy.get('solid-display[data-src="user-4.jsonld"]').should('exist').and('not.have.attr', 'active');
  });

  it('unset active on leaveRoute', () => {
    cy.get('#leave-route').click();
    cy.get('solid-display[data-src="user-1.jsonld"]').should('not.have.attr', 'active');
    cy.get('solid-display[data-src="user-2.jsonld"]').should('not.have.attr', 'active');
    cy.get('solid-display[data-src="user-3.jsonld"]').should('not.have.attr', 'active');
    cy.get('solid-display[data-src="user-4.jsonld"]').should('not.have.attr', 'active');
  });

  it('set active on enterRoute', () => {
    cy.get('#enter-route').click();
    cy.get('solid-display[data-src="user-1.jsonld"]').should('have.attr', 'active');
    cy.get('solid-display[data-src="user-2.jsonld"]').should('not.have.attr', 'active');
    cy.get('solid-display[data-src="user-3.jsonld"]').should('not.have.attr', 'active');
    cy.get('solid-display[data-src="user-4.jsonld"]').should('not.have.attr', 'active');
  });
})
