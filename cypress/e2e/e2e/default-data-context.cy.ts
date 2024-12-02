describe('default-data-context', function () {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/default-data-context.html');
  });

  it('default-data-context', () => {
    cy.get('solid-display > div').children().eq(0).contains('admin');

    cy.get('solid-display > div').children().eq(1).contains('Test User');
  });
});
