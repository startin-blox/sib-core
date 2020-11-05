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
  it('required mixin', () => {
    cy.get('#display-6 > div')
    .children().should('have.length', 4);

    cy.get('#display-7').should('have.attr', 'required-ocean');
    cy.get('#display-7 > div')
    .children().should('have.length', 0);

    cy.get('#display-8').should('have.attr', 'required-city');
    cy.get('#display-8 > div')
    .children().should('have.length', 2)
    cy.get('#display-8 > div').children().eq(0)
    .should('have.attr', 'data-src', 'event-3.jsonld');
    cy.get('#display-8 > div').children().eq(1)
    .should('have.attr', 'data-src', 'event-4.jsonld');

    cy.get('#display-9').should('have.attr', 'required-place');
    cy.get('#display-9 > div')
    .children().should('have.length', 2);
    cy.get('#display-9 > div').children().eq(0)
    .should('have.attr', 'data-src', 'event-2.jsonld');
    cy.get('#display-9 > div').children().eq(1)
    .should('have.attr', 'data-src', 'event-3.jsonld');

    cy.get('#display-10').should('have.attr', 'required-city');
    cy.get('#display-10').should('have.attr', 'required-place');
    cy.get('#display-10 > div').children().should('have.length', 1)
    cy.get('#display-10 > div > solid-display')
    .should('have.attr', 'data-src', 'event-3.jsonld');;
  });
  it('list-mixin : solid-container & solid-resource attributes', () => {
    cy.get('#display-11').should('have.attr', 'solid-container');
    cy.get('#display-11 > div').children().should('have.length', 4);

    cy.get('#display-12').should('have.attr', 'solid-resource');
    cy.get('#display-12 > div').children().should('have.length',1);
  });
  it("list-mixin : empty-value", () => {
    cy.get('#display-13').find('no-skill');
    cy.get('#display-13 > div > no-skill').contains('No skill yet')
  });
})