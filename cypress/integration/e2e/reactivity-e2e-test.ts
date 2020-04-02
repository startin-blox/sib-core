
describe('simple Startin’blox e2e test', function () {
  this.beforeAll('visit', () => {
    cy.server();
    cy.route('GET', '**/users/', 'fixture:users.jsonld');
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
    cy.get('solid-display#profile > div > solid-display-value:nth-child(1)').should('have.attr', 'name', 'city').should('have.text', 'Rennes');
    cy.get('solid-display#circle > div > solid-display-value:nth-child(1)').should('have.attr', 'name', 'owner.profile.city').should('have.text', 'Rennes');
    cy.get('solid-display#profile-widget > div > custom-widget').should('have.attr', 'name', 'profile');
    cy.get('solid-display#profile-widget > div > custom-widget > div').should('have.text', 'Rennes');
  });

  it('has reactive nested resources', () => {
    cy.server();
    cy.route({
      method: 'PATCH',
      url: '**/profiles/matthieu/',
      status: 200,
      response: {},
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    });
    cy.route('GET', '**/profiles/matthieu/', 'fixture:profiles-matthieu-edited.jsonld');

    cy.get('solid-form#profile-form input[name="city"]').clear().type('Paris');
    cy.get('solid-form#profile-form input[type=submit]').click();

    // Nested resource in dot field
    cy.get('solid-display#user > div > solid-display-value[name="profile.city"]').should('have.text', 'Paris');

    // Nested resource in nested field
    cy.get('solid-display#profile > div > solid-display-value[name="city"]').should('have.text', 'Paris');

    // Nested resource in custom widget
    cy.get('solid-display#profile-widget > div > custom-widget[name="profile"] > div').should('have.text', 'Paris');

    // Nested resource in multi dot field
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
    });
    cy.route({
      method: 'POST',
      url: '**/users/',
      status: 200,
      response: {},
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    });
    cy.route({
      method: 'DELETE',
      url: '**/users/alex/',
      status: 200,
      response: {},
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    });

    cy.route('GET', '**/users/matthieu/', 'fixture:users-matthieu-edited.jsonld');
    cy.route('GET', '**/users/', 'fixture:users-edited.jsonld');

    // Fill matthieu's form
    cy.get('solid-form#user-form input[name="first_name"]').clear().type('Test');
    cy.get('solid-form#user-form input[name="last_name"]').clear().type('User');
    cy.get('solid-form#user-form input[name="username"]').clear().type('admin');

    cy.get('solid-form#user-form input[type=submit]').click();

    // Single sib-display
    cy.get('solid-display#user > div > solid-display-value[name="first_name"]').should('have.text', 'Test');
    cy.get('solid-display#user > div > solid-display-value[name="last_name"]').should('have.text', 'User');
    cy.get('solid-display#user > div > solid-display-value[name="username"]').should('have.text', 'admin');

    // List sib-display & range
    const src = "https://api.test-paris.happy-dev.fr/users/matthieu/";
    cy.get(`solid-display#users solid-display[data-src="${src}"] > div > solid-display-value[name="first_name"]`).should('have.text', 'Test');
    cy.get(`solid-display#users solid-display[data-src="${src}"] > div > solid-display-value[name="last_name"]`).should('have.text', 'User');
    cy.get(`solid-display#users solid-display[data-src="${src}"] > div > solid-display-value[name="username"]`).should('have.text', 'admin');
    // cy.get(`solid-form#range option[value='{"@id": "${src}"}']`).should('have.text', 'Test User');

    // Fill new user form
    cy.get('solid-form#users-form input[name="first_name"]').clear().type('Alex');
    cy.get('solid-form#users-form input[name="last_name"]').clear().type('Bourlier');
    cy.get('solid-form#users-form input[name="username"]').clear().type('alex');

    cy.get('solid-form#users-form input[type=submit]').click();

    // List sib-display & range
    const newSrc = "https://api.test-paris.happy-dev.fr/users/alex/";
    cy.get(`solid-display#users solid-display`).should('have.length', 3);
    cy.get(`solid-display#users solid-display[data-src="${newSrc}"] > div > solid-display-value[name="first_name"]`).should('have.text', 'Alex');
    cy.get(`solid-display#users solid-display[data-src="${newSrc}"] > div > solid-display-value[name="last_name"]`).should('have.text', 'Bourlier');
    cy.get(`solid-display#users solid-display[data-src="${newSrc}"] > div > solid-display-value[name="username"]`).should('have.text', 'alex');
    cy.get(`solid-form#range option`).should('have.length', 4);

    // delete user & range
    cy.route('GET', '**/users/', 'fixture:users.jsonld');
    cy.get('solid-delete#delete-user').click();
    cy.get(`solid-display#users solid-display`).should('have.length', 2);
    cy.get(`solid-form#range option`).should('have.length', 3);

    cy.server({ enable: false });
  });

})
