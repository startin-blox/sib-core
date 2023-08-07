describe('solid-ac-checker', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-ac-checker.html')
  });

  it('permission attribute', () => {
    // permission => not displayed
    cy.get('#ac-checker-1').should('have.attr', 'hidden');
    cy.get('#test1').should('not.be.visible');
  });
  it('no-permission attribute', () => {
    // no-permission => displayed
    cy.get('#ac-checker-2').should('not.have.attr', 'hidden');
    cy.get('#test2').should('be.visible');
  });
  it('fetches permissions', () => {
    cy.get('#load').click();
    cy.get('#ac-checker-3').should('not.have.attr', 'hidden');
    cy.get('#test3').should('be.visible');
  });
})