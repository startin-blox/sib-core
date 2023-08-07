describe('solid-delete', function () {
  let win: Window;

  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-delete.html');
    cy.window().then(w => {
      win = w;
    });
  });

  it('calls store.delete and send events', () => {
    cy.spy(win.sibStore, 'delete');
    cy.server();
    cy.route({
      method: 'DELETE',
      url: '**/project.jsonld',
      status: 204,
      response: {},
    });
    // button created
    cy.get('solid-delete#test1').find('button').should('have.length', 1);
    cy.get('solid-delete#test1 button').should('have.text', 'Supprimer');
    // on click, store.delete is called
    cy.get('solid-delete#test1 button').click({ force: true }).then(() => {
      expect(win.sibStore.delete).to.be.called;
    });
    // events have been fired
    cy.get('#res')
      .should('contain', 'save: data/project.jsonld')
      .should('contain', 'resourceDeleted: data/project.jsonld')
      .should('contain', 'requestNavigation');
  });
  it('does not send events on failure', () => {
    cy.reload();
    cy.server();
    cy.route({
      method: 'DELETE',
      url: '**/project.jsonld',
      status: 403,
      response: {},
    });
    cy.get('solid-delete#test1 button').click({ force: true })
    // if server fails, events not fired
    cy.get('#res').should('be.empty');
  });
  it('re-render when label change', () => {
    cy.get('solid-delete#test1').then(el => {
      el.attr('data-label', 'Supprimer la ressource');
    cy.get('solid-delete#test1 > button').should('have.text', 'Supprimer la ressource');
    })
  });
})

