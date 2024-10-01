describe('set widget', function() {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/widgets-sets.html')
  }) 

  it('solid-set-default', () => {
    cy.get('solid-set-default')
      .children().should('have.length', 0);
  })

  it('solid-set-div', () => {
    cy.get('solid-set-div')
      .children().should('have.length', 1);
    cy.get('solid-set-div')
      .find('div')
      .should('have.attr', 'data-content', '');
  })
  
  it('solid-set-ul', () => {
    cy.get('solid-set-ul')
      .children().should('have.length', 1);
    cy.get('solid-set-ul')
      .find('ul')
      .should('have.attr', 'data-content', '');
  })
})
