describe('multiple widgets', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/widgets-display-multiple.html')
  });

  it('solid-display-multiple and empty widget', () => {
    cy.get('solid-multiple#noskill')
      .should('have.attr', 'empty-widget', 'empty-skills')
      .find('empty-skills')
      .should('contain', 'This username has no skills');
    cy.get('solid-multiple#noskill > solid-display > div')
      .children().should('have.length', 1);

    cy.get('solid-multiple#skills')
      .should('have.attr', 'empty-widget', 'empty-skills')
      .find('solid-display-value')
    cy.get('solid-multiple#skills > solid-display > div')
      .children().should('have.length', 2);
    cy.get('solid-multiple#skills empty-skills')
      .should('not.exist')
  });
})
