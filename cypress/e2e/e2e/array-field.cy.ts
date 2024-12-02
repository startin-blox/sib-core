describe('array-field', function () {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/array-field.html');
  });

  it('array-[field]', () => {
    // data-src in solid-display pointed on user-*.jsonld
    cy.get('#display-members > div')
      .children()
      .eq(0)
      .should('have.attr', 'data-src', '/examples/data/list/user-2.jsonld');
    cy.get('#display-members > div')
      .children()
      .eq(1)
      .should('have.attr', 'data-src', '/examples/data/list/user-1.jsonld');
    // Group's name not displayed
    cy.get('#display-members > div')
      .children()
      .eq(0)
      .find('solid-display-value')
      .should('not.contain.value', 'LDP_circle_members_1');
    cy.get('#display-members > div')
      .children()
      .eq(1)
      .find('solid-display-value')
      .should('not.contain.value', 'LDP_circle_members_1');
    // User's name displayed
    cy.get('#display-members > div')
      .children()
      .eq(0)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Benoit Alessandroni');
    cy.get('#display-members > div')
      .children()
      .eq(1)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Blaise Pascal');
  });

  it('array-field and order-asc', () => {
    cy.get('#display-members-asc > div')
      .children()
      .eq(0)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Benoit Alessandroni');
    cy.get('#display-members-asc > div')
      .children()
      .eq(1)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Blaise Pascal');
    cy.get('#display-members-asc > div')
      .children()
      .eq(2)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Eric Cantona');
    cy.get('#display-members-asc > div')
      .children()
      .eq(3)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Vitali Klitschko');
  });

  it('array-field and order-desc', () => {
    cy.get('#display-members-desc > div')
      .children()
      .eq(0)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Vitali Klitschko');
    cy.get('#display-members-desc > div')
      .children()
      .eq(1)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Eric Cantona');
    cy.get('#display-members-desc > div')
      .children()
      .eq(2)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Blaise Pascal');
    cy.get('#display-members-desc > div')
      .children()
      .eq(3)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Benoit Alessandroni');
  });
});
