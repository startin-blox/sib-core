
describe('simple Startin’blox e2e test', function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/reactivity-e2e-test.html');
  })
  it('check display', () => {
    cy.get('body > solid-display > div > solid-display-value:nth-child(1)').should('have.text', 'Test');
    cy.get('body > solid-display > div > solid-display-value:nth-child(2)').should('have.text', 'User');
    cy.get('body > solid-display > div > solid-display-value:nth-child(3)').should('have.text', 'admin');
  });
  it('checks reactivity', () => {
    cy.server();
    cy.route({ // on PUT, override headers
      url: '**/user-1.jsonld',
      method: 'PUT',
      headers: { 'content-type': 'application/ld+json' },
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    })

    // type data
    cy.get('body > solid-form input[name="first_name"]').clear().type('Monsieur');
    cy.get('body > solid-form input[name="last_name"]').clear().type('Administrateur');
    cy.get('body > solid-form input[name="username"]').clear().type('superadmin');

    // stub response for GET /user-1.jsonld
    cy.route('GET', '**/user-1.jsonld', 'fixture:user-1-edited.json')

    cy.get('body > solid-form input[type=submit]').click();

    // check sib-display update
    cy.get('body > solid-display > div > solid-display-value:nth-child(1)').should('have.text', 'Monsieur');
    cy.get('body > solid-display > div > solid-display-value:nth-child(2)').should('have.text', 'Administrateur');
    cy.get('body > solid-display > div > solid-display-value:nth-child(3)').should('have.text', 'superadmin');
  });
})
