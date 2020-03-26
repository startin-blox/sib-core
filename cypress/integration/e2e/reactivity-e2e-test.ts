describe('simple Startin’blox e2e test', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/reactivity-e2e-test.html')
  })
  it('check display', () => {
    cy.get('body > solid-display > div > solid-display-value:nth-child(1)').should('have.text', 'Test');
    cy.get('body > solid-display > div > solid-display-value:nth-child(2)').should('have.text', 'User');
    cy.get('body > solid-display > div > solid-display-value:nth-child(3)').should('have.text', 'admin');
  });
  it('checks reactivity', () => {
    // check updates in DOM
  });
})
