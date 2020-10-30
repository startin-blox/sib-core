describe('solid-form-search widget', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/search.html')
  })

  it('solid-form-search', () => {

    cy.get('solid-form-search#filter1')
      .find('select')
      .and('have.attr', 'name', 'username')
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
      .and('have.attr', 'name', 'last_name')
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
})