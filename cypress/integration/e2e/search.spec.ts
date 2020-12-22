describe('solid-form-search widget', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/search.html')
  })

  it('solid-form-search', () => {

    cy.get('solid-form-search#filter1')
      .find('select')
      .should('have.attr', 'name', 'username')
      .children().and('have.length', 6)
    cy.get('solid-form-search#filter1')
      .find('option').eq(0)
      .should('have.attr', 'value', '')
      .contains('-');
    cy.get('solid-form-search#filter1')
      .find('option').eq(1)
      .should('have.attr', 'value', 'admin')
      .contains('admin');
      
    cy.get('solid-form-search#filter2')
      .find('select')
      .should('have.attr', 'name', 'last_name')
      .children().and('have.length', 5);
    cy.get('solid-form-search#filter2')
      .find('option').eq(0)
      .should('have.attr', 'value', '')
      .contains('-');
    cy.get('solid-form-search#filter2')
      .find('option').eq(1)
      .should('have.attr', 'value', 'a')
      .contains('User');
  });

  it('solid-form-search + submit-button', () => {
    cy.get('#filter3')
      .find('input[type=submit]').as('btn')
      .should('have.attr', 'value', 'update result');
    cy.get('#display3 > div > solid-display').should('have.length', 4);
    cy.get('#filter3 select').select('User');
    cy.get('#display3 > div > solid-display').should('have.length', 4);
    cy.get('@btn').click()
    cy.get('#display3 > div > solid-display').should('have.length', 1);
  });

  it('solid-form-search + start-value & end-value', () => {
    cy.get('#filter4 > form')
      .find('solid-form-rangedate')
      .should('have.attr', 'start-value', '2020-06-01')
      .and('have.attr', 'end-value', '2021-01-12');
    cy.get('#display4 > div ')
      .children().should('have.length', 2)

    cy.get('#filter5 > form')
      .find('solid-form-rangenumber')
      .should('have.attr', 'start-value', '2')
      .and('have.attr', 'end-value', '10');
    cy.get('#display5 > div ')
      .children().should('have.length', 3)
  });
})
