describe('next', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/next.html')
  });

  it('goes to next', () => {
    cy.get('#list-1 > div').as('list');

    cy.get('@list').children()
      .should('have.length', 8);

    // Check next in solid-display
    cy.get('@list').contains('PHP').click();
    cy.get('#detail > div').should('be.visible').should('contain', 'skill-5.jsonld')
    cy.location().should((loc) => {
      expect(loc.hash).to.eq('#view/@skill-5.jsonld@')
    })
  });

  it('uses the right id with nested components', () => {
    cy.get('#list-2 > div').as('list');

    // Check next in solid-display
    cy.get('@list').contains('CSS').click();
    cy.get('#user-detail > div').should('be.visible').should('contain', 'user-1.jsonld')
    cy.location().should((loc) => {
      expect(loc.hash).to.eq('#user/@user-1.jsonld@')
    })
  });

  // Check next mixin on solid-display with keyboard
  it('next mixin accessibility', () => {
    cy.get('body').tab().tab().type('{enter}'); //.tab() from plugin to use tab keypress
    cy.get('#detail > div').should('be.visible').should('contain', 'skill-2.jsonld')
    cy.location().should((loc) => {
      expect(loc.hash).to.eq('#view/@skill-2.jsonld@')
    })
  });
})