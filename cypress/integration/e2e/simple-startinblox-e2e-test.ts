describe('simple Startin’blox e2e test', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/simple-startinblox-e2e-test.html')
  })
  it('check children count', () => {
    cy.get('body > solid-display > div').children().should('have.length', 4)
  })
  it('check first children content', () => {
    cy.get('body > solid-display > div > solid-display:first-child > div > solid-display-value:first-child')
      .should('have.attr', 'name', 'firstName')
      .should('have.text', 'Test')
  })
})
