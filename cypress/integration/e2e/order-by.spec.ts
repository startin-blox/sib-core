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
    .should('have.attr', 'data-src', '/examples/data/list/skill-2.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-2.jsonld');
      cy.get('solid-display-value[name="name"]').contains('CSS');
    });

    cy.get('@list').find('solid-display').eq(1)
    .should('have.attr', 'data-src', '/examples/data/list/skill-4.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-4.jsonld');
      cy.get('solid-display-value[name="name"]').contains('DevOps');
    });

    cy.get('@list').find('solid-display').eq(2)
    .should('have.attr', 'data-src', '/examples/data/list/skill-6.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-6.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Git');
    });

    cy.get('@list').find('solid-display').eq(3)
    .should('have.attr', 'data-src', '/examples/data/list/skill-1.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-1.jsonld');
      cy.get('solid-display-value[name="name"]').contains('HTML');
    });

    cy.get('@list').find('solid-display').eq(4)
    .should('have.attr', 'data-src', '/examples/data/list/skill-3.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-3.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Javascript');
    });

    cy.get('@list').find('solid-display').eq(5)
    .should('have.attr', 'data-src', '/examples/data/list/skill-8.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-8.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Node');
    });

    cy.get('@list').find('solid-display').eq(6)
    .should('have.attr', 'data-src', '/examples/data/list/skill-5.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-5.jsonld');
      cy.get('solid-display-value[name="name"]').contains('PHP');
    });

    cy.get('@list').find('solid-display').eq(7)
    .should('have.attr', 'data-src', '/examples/data/list/skill-7.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-7.jsonld');
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
  it('order-desc', () => {
    cy.get('#list-3 > div').as('list');

    cy.get('@list').children()
    .should('have.length', 8);
    // Check elements order
    cy.get('@list').find('solid-display').eq(0)
    .should('have.attr', 'data-src', '/examples/data/list/skill-7.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-7.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Python');
    });

    cy.get('@list').find('solid-display').eq(1)
    .should('have.attr', 'data-src', '/examples/data/list/skill-5.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-5.jsonld');
      cy.get('solid-display-value[name="name"]').contains('PHP');
    });

    cy.get('@list').find('solid-display').eq(2)
    .should('have.attr', 'data-src', '/examples/data/list/skill-8.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-8.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Node');
    });

    cy.get('@list').find('solid-display').eq(3)
    .should('have.attr', 'data-src', '/examples/data/list/skill-3.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-3.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Javascript');
    });

    cy.get('@list').find('solid-display').eq(4)
    .should('have.attr', 'data-src', '/examples/data/list/skill-1.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-1.jsonld');
      cy.get('solid-display-value[name="name"]').contains('HTML');
    });

    cy.get('@list').find('solid-display').eq(5)
    .should('have.attr', 'data-src', '/examples/data/list/skill-6.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-6.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Git');
    });

    cy.get('@list').find('solid-display').eq(6)
    .should('have.attr', 'data-src', '/examples/data/list/skill-4.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-4.jsonld');
      cy.get('solid-display-value[name="name"]').contains('DevOps');
    });

    cy.get('@list').find('solid-display').eq(7)
    .should('have.attr', 'data-src', '/examples/data/list/skill-2.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-2.jsonld');
      cy.get('solid-display-value[name="name"]').contains('CSS');
    });
  });

  /**
   * Number value
   */
  it('number', () => {
    cy.get('#list-4 > div').as('list');
    cy.get('@list').children()
    .should('have.length', 8);
    // Check elements order
    cy.get('@list').find('solid-display').eq(0)
    .should('have.attr', 'data-src', '/examples/data/list/skill-1.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-1.jsonld');
      cy.get('solid-display-value[name="name"]').contains('HTML');
    });

    cy.get('@list').find('solid-display').eq(1)
    .should('have.attr', 'data-src', '/examples/data/list/skill-3.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-3.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Javascript');
    });

    cy.get('@list').find('solid-display').eq(2)
    .should('have.attr', 'data-src', '/examples/data/list/skill-2.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-2.jsonld');
      cy.get('solid-display-value[name="name"]').contains('CSS');
    });

    cy.get('@list').find('solid-display').eq(3)
    .should('have.attr', 'data-src', '/examples/data/list/skill-4.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-4.jsonld');
      cy.get('solid-display-value[name="name"]').contains('DevOps');
    });

    cy.get('@list').find('solid-display').eq(4)
    .should('have.attr', 'data-src', '/examples/data/list/skill-5.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-5.jsonld');
      cy.get('solid-display-value[name="name"]').contains('PHP');
    });

    cy.get('@list').find('solid-display').eq(5)
    .should('have.attr', 'data-src', '/examples/data/list/skill-6.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-6.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Git');
    });

    cy.get('@list').find('solid-display').eq(6)
    .should('have.attr', 'data-src', '/examples/data/list/skill-7.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-7.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Python');
    });

    cy.get('@list').find('solid-display').eq(7)
    .should('have.attr', 'data-src', '/examples/data/list/skill-8.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-8.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Node');
    });
  });

  /**
   * Retrocompatibility - order-by
   */
  it('order-by', () => {
    cy.get('#list-5 > div').as('list');

    cy.get('@list').children()
    .should('have.length', 8);
    // Check elements order
    cy.get('@list').find('solid-display').eq(0)
    .should('have.attr', 'data-src', '/examples/data/list/skill-2.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-2.jsonld');
      cy.get('solid-display-value[name="name"]').contains('CSS');
    });

    cy.get('@list').find('solid-display').eq(1)
    .should('have.attr', 'data-src', '/examples/data/list/skill-4.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-4.jsonld');
      cy.get('solid-display-value[name="name"]').contains('DevOps');
    });

    cy.get('@list').find('solid-display').eq(2)
    .should('have.attr', 'data-src', '/examples/data/list/skill-6.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-6.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Git');
    });

    cy.get('@list').find('solid-display').eq(3)
    .should('have.attr', 'data-src', '/examples/data/list/skill-1.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-1.jsonld');
      cy.get('solid-display-value[name="name"]').contains('HTML');
    });

    cy.get('@list').find('solid-display').eq(4)
    .should('have.attr', 'data-src', '/examples/data/list/skill-3.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-3.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Javascript');
    });

    cy.get('@list').find('solid-display').eq(5)
    .should('have.attr', 'data-src', '/examples/data/list/skill-8.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-8.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Node');
    });

    cy.get('@list').find('solid-display').eq(6)
    .should('have.attr', 'data-src', '/examples/data/list/skill-5.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-5.jsonld');
      cy.get('solid-display-value[name="name"]').contains('PHP');
    });

    cy.get('@list').find('solid-display').eq(7)
    .should('have.attr', 'data-src', '/examples/data/list/skill-7.jsonld')
    .within(() => {
      cy.get('solid-display-value[name="@id"]').contains('/examples/data/list/skill-7.jsonld');
      cy.get('solid-display-value[name="name"]').contains('Python');
    });
  });

  /**
   * Sorted-by attribute (with solid-form-search)
   */
  it('sorted-by', () => {
    cy.get('#sorter select[name="field"]').select('username');
    cy.get('#sorter select[name="order"]').select('desc');
    cy.get('#list-6 > div').children().should('have.length', 4);
    cy.get('#list-6 > div').children().eq(0).should('have.attr', 'data-src', 'user-4.jsonld');
    cy.get('#list-6 > div').children().eq(1).should('have.attr', 'data-src', 'user-2.jsonld');
    cy.get('#list-6 > div').children().eq(2).should('have.attr', 'data-src', 'user-3.jsonld');
    cy.get('#list-6 > div').children().eq(3).should('have.attr', 'data-src', 'user-1.jsonld');

    cy.get('#sorter select[name="field"]').select('email');
    cy.get('#sorter select[name="order"]').select('asc');
    cy.get('#list-6 > div').children().should('have.length', 4);
    cy.get('#list-6 > div').children().eq(0).should('have.attr', 'data-src', 'user-3.jsonld');
    cy.get('#list-6 > div').children().eq(1).should('have.attr', 'data-src', 'user-2.jsonld');
    cy.get('#list-6 > div').children().eq(2).should('have.attr', 'data-src', 'user-4.jsonld');
    cy.get('#list-6 > div').children().eq(3).should('have.attr', 'data-src', 'user-1.jsonld');
  });
})
