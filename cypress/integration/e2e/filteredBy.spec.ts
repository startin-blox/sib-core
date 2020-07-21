describe('simple Startin’blox e2e test', function() {
  it('check children count', () => {
    cy.visit('/examples/filtered.html')
    cy.get('#filter1 input').type('hilton')
    cy.get('#filter2 input').type('paris')
    cy.get('main > div:nth-child(1) > solid-display > div > solid-display').its('length').should('eq', 1);
    cy.get('main > div:nth-child(2) > solid-display > div > solid-display').its('length').should('eq', 1);
    cy.get('#filter1 input').clear().type('-')
    cy.get('main > div:nth-child(1) > solid-display > div > solid-display').its('length').should('eq', 3);
    cy.get('main > div:nth-child(2) > form input[value="filter2"]').click()
    cy.get('main > div:nth-child(2) > solid-display > div > solid-display').its('length').should('eq', 2);
  })
})
