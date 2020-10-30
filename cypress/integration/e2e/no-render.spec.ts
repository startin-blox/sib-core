describe('no-render', function() {
  let win: Window;

  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/no-render.html');
    cy.window().then(w => {
      win = w;
    });
  });
  it('blocks rendering', () => {
    cy.spy(win.store, 'fetchData');

    cy.get('#list').as('list')
    cy.wait(500);
    cy.get('@list').children()
      .should('have.length', 0);

    cy.get('@list').then($el => {
      expect(win.store.fetchData).to.have.callCount(0);
      $el.removeAttr('no-render');
      cy.get('@list').find(' > div').children()
        .should('have.length', 8).then(() => {
          expect(win.store.fetchData).to.be.called;
        });
    });
  });
})