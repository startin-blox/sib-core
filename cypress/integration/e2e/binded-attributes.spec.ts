describe('binded-attributes', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/binded-attributes.html')
  });

  it('replace store://resource', () => {
    cy.get('#events').contains('Workshop').click();

    // Value store://resource.date replaced
    cy.get('#infos')
      .should('have.attr', 'data-src', 'event-2.jsonld')
      .and('have.attr', 'value-custom-field', '2020-05-10');
    cy.get('#infos solid-display-value[name="custom-field"]')
      .should('have.text', '2020-05-10');

    // Reset attribute
    cy.get('solid-route').contains('Events').click();
    cy.get('#events').contains('Coliving').click();
    cy.get('#infos')
      .should('have.attr', 'data-src', 'event-1.jsonld')
      .and('have.attr', 'value-custom-field', '2020-07-09');
    cy.get('#infos solid-display-value[name="custom-field"]')
      .should('have.text', '2020-07-09');
  })

  it('replace store://user', () => {
    cy.get('#infos')
      .should('have.attr', 'value-user', 'Paris');
    cy.get('#infos solid-display-value[name="user"]')
      .should('have.text', 'Paris');
  })
})
