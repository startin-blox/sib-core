describe('order-by', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/order-by.html')
  });
  /**
  * Order-asc
  */
  it('order-asc', () => {
    cy.get('#list-1 > div').as('list');

    cy.get('@list').children()
    .should('have.length', 8);
    // Check elements order
    cy.get('@list').find('solid-display').eq(0)
    .should('have.attr', 'data-src', 'skill-2.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-2.jsonld');
      cy.get('solid-display-value[name="name"]').contains('CSS');
    });

    cy.get('@list').find('solid-display').eq(1)
    .should('have.attr', 'data-src', 'skill-4.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-4.jsonld');
      cy.get('solid-display-value[name="name"]').contains('DevOps');
    });

    cy.get('@list').find('solid-display').eq(2)
    .should('have.attr', 'data-src', 'skill-6.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-6.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Git');
    });

    cy.get('@list').find('solid-display').eq(3)
    .should('have.attr', 'data-src', 'skill-1.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-1.jsonld');
      cy.get('solid-display-value[name="name"]').contains('HTML');
    });

    cy.get('@list').find('solid-display').eq(4)
    .should('have.attr', 'data-src', 'skill-3.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-3.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Javascript');
    });

    cy.get('@list').find('solid-display').eq(5)
    .should('have.attr', 'data-src', 'skill-8.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-8.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Node');
    });

    cy.get('@list').find('solid-display').eq(6)
    .should('have.attr', 'data-src', 'skill-5.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-5.jsonld');
      cy.get('solid-display-value[name="name"]').contains('PHP');
    });

    cy.get('@list').find('solid-display').eq(7)
    .should('have.attr', 'data-src', 'skill-7.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-7.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Python');
    });
  });

  /**
  * order-by-random
  */
  it('sorts resources by random', () => {
    cy.get('#list-2').as('list');

    cy.get('@list').find('> div').children()
    .should('have.length', 8);

    cy.get('@list').find('> div > solid-display').then($div => {
      let currentOrder = Array.from($div.map((_index, el) => el.dataset.src))
      cy.get('#reloadList').click();
      cy.get('@list').find('> div > solid-display').then($newDiv => {
        let newOrder = Array.from($newDiv.map((_index, el) => el.dataset.src))
        expect(currentOrder).to.not.include.ordered.members(newOrder);
      })
    });
  });

  /**
   * order-desc
   */
  it('order-asc', () => {
    cy.get('#list-3 > div').as('list');

    cy.get('@list').children()
    .should('have.length', 8);
    // Check elements order
    cy.get('@list').find('solid-display').eq(0)
    .should('have.attr', 'data-src', 'skill-7.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-7.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Python');
    });

    cy.get('@list').find('solid-display').eq(1)
    .should('have.attr', 'data-src', 'skill-5.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-5.jsonld');
      cy.get('solid-display-value[name="name"]').contains('PHP');
    });

    cy.get('@list').find('solid-display').eq(2)
    .should('have.attr', 'data-src', 'skill-8.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-8.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Node');
    });

    cy.get('@list').find('solid-display').eq(3)
    .should('have.attr', 'data-src', 'skill-3.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-3.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Javascript');
    });

    cy.get('@list').find('solid-display').eq(4)
    .should('have.attr', 'data-src', 'skill-1.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-1.jsonld');
      cy.get('solid-display-value[name="name"]').contains('HTML');
    });

    cy.get('@list').find('solid-display').eq(5)
    .should('have.attr', 'data-src', 'skill-6.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-6.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Git');
    });

    cy.get('@list').find('solid-display').eq(6)
    .should('have.attr', 'data-src', 'skill-4.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-4.jsonld');
      cy.get('solid-display-value[name="name"]').contains('DevOps');
    });

    cy.get('@list').find('solid-display').eq(7)
    .should('have.attr', 'data-src', 'skill-2.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-2.jsonld');
      cy.get('solid-display-value[name="name"]').contains('CSS');
    });
  });

  /**
   * Retrocompatibility - order-by
   */
  it('order-by', () => {
    cy.get('#list-4 > div').as('list');

    cy.get('@list').children()
    .should('have.length', 8);
    // Check elements order
    cy.get('@list').find('solid-display').eq(0)
    .should('have.attr', 'data-src', 'skill-2.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-2.jsonld');
      cy.get('solid-display-value[name="name"]').contains('CSS');
    });

    cy.get('@list').find('solid-display').eq(1)
    .should('have.attr', 'data-src', 'skill-4.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-4.jsonld');
      cy.get('solid-display-value[name="name"]').contains('DevOps');
    });

    cy.get('@list').find('solid-display').eq(2)
    .should('have.attr', 'data-src', 'skill-6.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-6.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Git');
    });

    cy.get('@list').find('solid-display').eq(3)
    .should('have.attr', 'data-src', 'skill-1.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-1.jsonld');
      cy.get('solid-display-value[name="name"]').contains('HTML');
    });

    cy.get('@list').find('solid-display').eq(4)
    .should('have.attr', 'data-src', 'skill-3.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-3.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Javascript');
    });

    cy.get('@list').find('solid-display').eq(5)
    .should('have.attr', 'data-src', 'skill-8.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-8.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Node');
    });

    cy.get('@list').find('solid-display').eq(6)
    .should('have.attr', 'data-src', 'skill-5.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-5.jsonld');
      cy.get('solid-display-value[name="name"]').contains('PHP');
    });

    cy.get('@list').find('solid-display').eq(7)
    .should('have.attr', 'data-src', 'skill-7.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('skill-7.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Python');
    });
  });
})
