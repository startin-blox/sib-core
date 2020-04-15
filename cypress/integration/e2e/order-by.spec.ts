describe('order-by', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/order-by.html')
  });
  /**
  * Sorts at loading time
  */
  it('sorts resources', () => {
    cy.get('#list-1 > div').as('list');

    cy.get('@list').children()
    .should('have.length', 4);
    // Check elements order
    cy.get('@list').find('solid-display').eq(0)
    .should('have.attr', 'data-src', 'user-1.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('user-1.jsonld');
      cy.get('solid-display-value[name="username"]').contains('admin');
    });
    cy.get('@list').find('solid-display').eq(1)
    .should('have.attr', 'data-src', 'user-3.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('user-3.jsonld');
      cy.get('solid-display-value[name="username"]').contains('not-member-paris');
    });
    cy.get('@list').find('solid-display').eq(2)
    .should('have.attr', 'data-src', 'user-2.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('user-2.jsonld');
      cy.get('solid-display-value[name="username"]').contains('paris');
    });
    cy.get('@list').find('solid-display').eq(3)
    .should('have.attr', 'data-src', 'user-4.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('user-4.jsonld');
      cy.get('solid-display-value[name="username"]').contains('pierre');
    });
  });

  /**
  * Random order
  */
  it('sorts resources by random', () => {
    cy.get('#list-2').as('list');

    cy.get('@list').find('> div').children()
    .should('have.length', 4);

    cy.get('@list').find('> div > solid-display').then($div => {
      let currentOrder = Array.from($div.map((_index, el) => el.dataset.src))
      cy.get('#reloadList').click();
      cy.get('@list').find('> div > solid-display').then($newDiv => {
        let newOrder = Array.from($newDiv.map((_index, el) => el.dataset.src))
        expect(currentOrder).to.not.include.ordered.members(newOrder);
      })
    });
  });
})
