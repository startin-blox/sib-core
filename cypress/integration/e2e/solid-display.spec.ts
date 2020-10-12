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
  });
  it('handle fields attribute', () => {
    // all fields
    cy.get('#display-3>div').children().eq(0)
      .should('not.have.attr', 'fields');
    cy.get('#display-3>div').children().eq(0)
      .find('>div').children()
      .should('have.length', 8);
    // no fields
    cy.get('#display-4>div').children()
      .should('have.attr', 'fields', '');
    cy.get('#display-4>div').children().eq(0)
      .find('>div').children()
      .should('have.length', 0);
  });
  it('handle native HTML tags', () => {
    cy.get('#display-5 > div > h2')
      .should('have.attr', 'name', 'name')
      .and('have.class', 'custom-class')
      .and('have.text', 'Coliving');
  });
})