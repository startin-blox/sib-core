describe('next', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/next.html')
  });
  /**
  * Sorts at loading time
  */
  it('sorts resources', () => {
    cy.get('#list > div').as('list');

    cy.get('@list').children()
      .should('have.length', 8);

    // Check next in solid-display
    cy.get('@list').contains('PHP').click();
    cy.get('#detail > div').should('be.visible').should('contain', 'skill-5.jsonld')
    cy.location().should((loc) => {
      expect(loc.hash).to.eq('#view/@skill-5.jsonld@')
    })
  });
})