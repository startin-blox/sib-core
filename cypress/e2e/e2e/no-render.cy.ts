describe('no-render', function() {
  let win: Window;

  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/no-render.html');
    cy.window().then(w => {
      win = w;
    });
  });
  it('blocks rendering', () => {
    cy.spy(win.sibStore, 'fetchData');

    cy.get('#list').as('list')
    cy.wait(500);
    cy.get('@list').children()
      .should('have.length', 0);

    cy.get('@list').then($el => {
      expect(win.sibStore.fetchData).to.have.callCount(0);
      $el.removeAttr('no-render');
      cy.get('@list').find(' > div').children()
        .should('have.length', 8).then(() => {
          expect(win.sibStore.fetchData).to.be.called;
        });
    });
  });

  it('blocks nested rendering', () => {
    cy.spy(win.sibStore, 'fetchData');

    cy.get('#nested-list').as('list')
    cy.wait(500);
    cy.get('@list').children()
      .should('have.length', 0);

    cy.get('@list').then($el => {
      expect(win.sibStore.fetchData).to.have.callCount(0);
      $el.removeAttr('no-render');
      cy.get('@list').find(' > div').children()
        .should('have.length', 4).then(() => {
          expect(win.sibStore.fetchData).to.be.called;
        });
    });
  });

  it('blocks rendering if no data-src', () => {
    cy.get('#form').as('form')
    cy.wait(500);
    cy.get('@form').children()
      .should('have.length', 0);

    cy.get('#form-search').as('form-search')
      cy.wait(500);
      cy.get('@form-search').children()
        .should('have.length', 0);
  });
})