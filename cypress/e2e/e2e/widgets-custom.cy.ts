describe('custom widgets', function () {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/widgets-custom.html');
  });

  it('set value', () => {
    cy.get('solid-display#test1')
      .find('custom-widget')
      .should('have.length', 1)
      .and('have.attr', 'class', 'custom-widget')
      .find('h1')
      .should('contain', 'Envoyer une fusée');
  });

  it('set attributes', () => {
    cy.get('solid-display#test2')
      .find('custom-widget')
      .should('have.length', 1)
      .and('have.attr', 'class', 'custom-widget test-class');
  });
});
