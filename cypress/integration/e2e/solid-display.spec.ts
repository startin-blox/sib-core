describe('solid-display', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-display.html')
  });

    it('display user', () => {
      cy.get('#display-1>div').children().eq(0).should('have.attr', 'name', 'event')
      .should('have.attr', 'value', 'Event name and date : ')
      .should('have.class', 'presentationEvent');
      
      cy.get('#display-2 solid-set-default').should('have.attr', 'name', 'completeName')
      .should('have.class', 'completeName')
      .children().should('have.length', 3);
    })
  })