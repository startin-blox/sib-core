// TODO: We should make tests run independently of one another
describe('binded-attributes', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/binded-attributes.html');
  });

  it('replace store://resource and store://container and store://user', () => {
    cy.get('#events')
      .should(
        'have.attr',
        'value-custom-id',
        '/examples/data/list/events.jsonld',
      )
      .and('have.attr', 'value-child-date', 'store://resource.date');

    cy.get(
      '#events solid-display[data-src="/examples/data/list/event-1.jsonld"]',
    )
      .should(
        'have.attr',
        'value-custom-id',
        '/examples/data/list/events.jsonld',
      )
      .and('have.attr', 'value-child-date', '2020-07-09');

    cy.get('#events').contains('Workshop').click();

    // Value store://resource.date replaced
    cy.get('#infos')
      .should('have.attr', 'data-src', '/examples/data/list/event-2.jsonld')
      .and('have.attr', 'value-custom-field', '2020-05-10')
      .and('have.attr', 'value-wrong-field', 'store://container.@id');
    cy.get('#infos solid-display-value[name="custom-field"]').should(
      'have.text',
      '2020-05-10',
    );
    cy.get('#infos solid-display-value[name="wrong-field"]').should(
      'have.text',
      'store://container.@id',
    );

    // Works in solid-table
    cy.get('#table')
      .find(
        'tr[data-resource="/examples/data/list/event-1.jsonld"] solid-display-value[name="temp"]',
      )
      .should('have.attr', 'value', '/examples/data/list/event-1.jsonld');

    // Reset attribute
    cy.get('solid-route').contains('Events').click();
    cy.get('#events').contains('Coliving').click();
    cy.get('#infos')
      .should('have.attr', 'data-src', '/examples/data/list/event-1.jsonld')
      .and('have.attr', 'value-custom-field', '2020-07-09');
    cy.get('#infos solid-display-value[name="custom-field"]').should(
      'have.text',
      '2020-07-09',
    );
  });

  it('replace store://user', () => {
    cy.get('#infos').should('have.attr', 'value-user', 'Paris');
    cy.get('#infos solid-display-value[name="user"]').should(
      'have.text',
      'Paris',
    );

    // Back home
    cy.get('solid-route[name=home]').click();
    cy.get('[data-view=home] solid-delete button').should('have.text', 'admin');
    cy.get('[data-view=home] solid-form-search input[type=text]').should(
      'have.value',
      'Test',
    );
  });
});
