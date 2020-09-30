describe('solid-form-search widget', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/search.html')
  })

  it('solid-form-search', () => {
    
    cy.get('solid-display#test1')// check attributes
      .find('solid-form-dropdown')
      .and('have.attr', 'name', 'options')  
      .find('select')
      .and('have.attr', 'name', 'options')
      .children().and('have.length', 5);
    cy.get('solid-display#test1') // check options
      .find('option').eq(0)
      .should('have.attr', 'value', '')
      .contains('-');
    cy.get('solid-display#test1')
      .find('option').eq(1)
      .should('have.attr', 'value', 'option1')
      .contains('option1');

    cy.get('solid-display#test2')// check attributes
      .find('solid-form-dropdown')
      .and('have.attr', 'name', 'options2')  
      .find('select')
      .and('have.attr', 'name', 'options2')
      .children().and('have.length', 4);
    cy.get('solid-display#test2') // check options
      .find('option').eq(0)
      .should('have.attr', 'value', '')
      .contains('-');
    cy.get('solid-display#test2')
      .find('option').eq(1)
      .should('have.attr', 'value', '1')
      .contains('option a');
  });
})
