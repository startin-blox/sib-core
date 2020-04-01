
describe('simple Startin’blox e2e test', function () {
  this.beforeAll('visit', () => {
    cy.server();
    cy.route('GET', '**/users/matthieu/', 'fixture:users-matthieu.jsonld');
    cy.route('GET', '**/profiles/matthieu/', 'fixture:profiles-matthieu.jsonld');
    cy.route('GET', '**/circles/16/', 'fixture:circles-16.jsonld');
    cy.visit('/examples/e2e/reactivity-e2e-test.html');
    cy.server({ enable: false });
  })
  it('check display', () => {
    cy.get('solid-display#user > div > solid-display-value:nth-child(1)').should('have.attr', 'name', 'first_name').should('have.text', 'Matthieu');
    cy.get('solid-display#user > div > solid-display-value:nth-child(2)').should('have.attr', 'name', 'last_name').should('have.text', 'Fesselier');
    cy.get('solid-display#user > div > solid-display-value:nth-child(3)').should('have.attr', 'name', 'username').should('have.text', 'matthieu');
    cy.get('solid-display#user > div > solid-display-value:nth-child(4)').should('have.attr', 'name', 'profile.city').should('have.text', 'Rennes');
    cy.get('solid-display#circle > div > solid-display-value:nth-child(1)').should('have.attr', 'name', 'owner.profile.city').should('have.text', 'Rennes');
  });

  it('has reactive nested properties', () => {
    cy.server();
    cy.route({
      method: 'PATCH',
      url: '**/profiles/matthieu/',
      status: 200,
      response: {},
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    });
    cy.route('GET', '**/profiles/matthieu/', 'fixture:profiles-matthieu-edited.jsonld');

    cy.get('solid-form#profile input[name="city"]').clear().type('Paris');
    cy.get('solid-form#profile input[type=submit]').click();
    cy.get('solid-display#user > div > solid-display-value[name="profile.city"]').should('have.text', 'Paris');
    // cy.get('solid-display#circle > div > solid-display-value[name="owner.profile.city"]').should('have.text', 'Paris'); DOES NOT WORK YET
    cy.server({ enable: false });
  });

  it('has reactive properties', () => {
    cy.server();
    cy.route({
      method: 'PATCH',
      url: '**/users/matthieu/',
      status: 200,
      response: {},
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    })

    cy.route('GET', '**/users/matthieu/', 'fixture:users-matthieu-edited.jsonld');

    cy.get('solid-form#user input[name="first_name"]').clear().type('Test');
    cy.get('solid-form#user input[name="last_name"]').clear().type('User');
    cy.get('solid-form#user input[name="username"]').clear().type('admin');

    cy.get('solid-form#user input[type=submit]').click();

    cy.get('solid-display#user > div > solid-display-value[name="first_name"]').should('have.text', 'Test');
    cy.get('solid-display#user > div > solid-display-value[name="last_name"]').should('have.text', 'User');
    cy.get('solid-display#user > div > solid-display-value[name="username"]').should('have.text', 'admin');
    cy.server({ enable: false });
  });

})
