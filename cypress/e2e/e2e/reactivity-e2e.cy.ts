// TODO: We should make tests run independently of one another
describe('Reactivity e2e test2', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.intercept('GET', 'https://ldp-server2.test/users/', {
      fixture: 'users-nantes.jsonld',
    });
    cy.intercept('GET', 'https://ldp-server.test/users/', {
      fixture: 'users-paris.jsonld',
    });

    cy.intercept('GET', '**/sources/users/', {
      fixture: 'users-source.jsonld',
    });
    cy.intercept('GET', '**/users/matthieu/', {
      fixture: 'users-matthieu.jsonld',
    });
    cy.intercept('GET', '**/users/matthieu/circles/', {
      fixture: 'users-matthieu-circles.jsonld',
    });
    cy.intercept('GET', '**/profiles/matthieu/', {
      fixture: 'profiles-matthieu.jsonld',
    });
    cy.intercept('GET', '**/profiles/jbpasquier/', {
      fixture: 'profiles-jbpasquier.jsonld',
    });
    cy.intercept('GET', '**/profiles/alex/', {
      fixture: 'profiles-alex.jsonld',
    });
    cy.intercept('GET', '**/circles/16/', {
      fixture: 'circles-16.jsonld',
    });
    cy.intercept('GET', '**/circles/17/members/', {
      fixture: 'circles-17-members.jsonld',
    });

    cy.visit('/examples/e2e/reactivity-e2e-test.html');
  });

  it('check display', () => {
    cy.intercept('GET', 'https://ldp-server2.test/users/', {
      fixture: 'users-nantes.jsonld',
    });
    cy.intercept('GET', 'https://ldp-server.test/users/', {
      fixture: 'users-paris.jsonld', // add fixture in case everything is not loaded yet
    });

    cy.get('solid-display#user > div > solid-display-value:nth-child(1)')
      .should('have.attr', 'name', 'first_name')
      .should('contain', 'Matthieu');
    cy.get('solid-display#user > div > solid-display-value:nth-child(2)')
      .should('have.attr', 'name', 'last_name')
      .should('contain', 'Fesselier');
    cy.get('solid-display#user > div > solid-display-value:nth-child(3)')
      .should('have.attr', 'name', 'username')
      .should('contain', 'matthieu');
    cy.get('solid-display#user > div > solid-display-value:nth-child(4)')
      .should('have.attr', 'name', 'profile.city')
      .should('contain', 'Rennes');
    cy.get('solid-display#profile > div > solid-display-value:nth-child(1)')
      .should('have.attr', 'name', 'city')
      .should('contain', 'Rennes');
    cy.get('solid-display#circle > div > solid-display-value:nth-child(1)')
      .should('have.attr', 'name', 'owner.profile.city')
      .should('contain', 'Rennes');
    cy.get('solid-display#profile-widget > div > custom-widget').should(
      'have.attr',
      'name',
      'profile',
    );
    cy.get('solid-display#profile-widget > div > custom-widget > div').should(
      'contain',
      'Rennes',
    );
    cy.get('solid-display#federation solid-display').should('have.length', 3);
    cy.get('solid-display#circles-user solid-display').should('have.length', 1);
  });

  it('has reactive nested resources', () => {
    cy.intercept('PATCH', '**/profiles/matthieu/', {
      headers: {
        'content-type': 'application/ld+json',
      },
    });

    cy.intercept('PATCH', '**/users/matthieu/', {
      headers: {
        'content-type': 'application/ld+json',
      },
    });

    cy.intercept('GET', '**/users/matthieu/', {
      fixture: 'users-matthieu.jsonld',
    });
    cy.intercept('GET', '**/profiles/matthieu/', {
      fixture: 'profiles-matthieu-edited.jsonld',
    });
    cy.intercept('GET', '**/sources/users/', {
      fixture: 'users-source.jsonld',
    });
    cy.intercept('GET', 'https://ldp-server.test/users/', {
      fixture: 'users-paris.jsonld',
    });
    cy.intercept('GET', 'https://ldp-server2.test/users/', {
      fixture: 'users-nantes.jsonld',
    });

    cy.get('solid-form#profile-form input[name="city"]').clear().type('Paris');
    cy.get('solid-form#profile-form input[type=submit]').click();

    // Nested resource in dot field
    cy.get(
      'solid-display#user > div > solid-display-value[name="profile.city"]',
    ).should('contain', 'Paris');

    // Nested resource in nested field
    cy.get(
      'solid-display#profile > div > solid-display-value[name="city"]',
    ).should('contain', 'Paris');

    // Nested resource in custom widget
    cy.get(
      'solid-display#profile-widget > div > custom-widget[name="profile"] > div',
    ).should('contain', 'Paris');

    // Nested field in form
    cy.intercept('GET', '**/profiles/matthieu/', {
      fixture: 'profiles-matthieu-edited-2.jsonld',
    });
    cy.get('solid-form#user-form-city input[name="profile.city"]')
      .clear()
      .type('Briouze');
    cy.get('solid-form#user-form-city input[type=submit]').click();

    cy.get(
      'solid-display#user > div > solid-display-value[name="profile.city"]',
    ).should('have.text', 'Briouze');
    cy.get(
      'solid-display#profile > div > solid-display-value[name="city"]',
    ).should('have.text', 'Briouze');
    cy.get(
      'solid-display#profile-widget > div > custom-widget[name="profile"] > div',
    ).should('have.text', 'Briouze');

    // Nested resource in multi dot field
    // cy.get('solid-display#circle > solid-display-value[name="owner.profile.city"]').should('contain', 'Paris'); DOES NOT WORK YET
  });

  it('has reactive properties', () => {
    cy.intercept('GET', '**/users/matthieu/', {
      fixture: 'users-matthieu-edited.jsonld',
    });
    cy.intercept('GET', '**/sources/users/', {
      fixture: 'users-source.jsonld',
    });
    cy.intercept('GET', 'https://ldp-server.test/users/', {
      fixture: 'users-edited.jsonld',
    });
    cy.intercept('GET', 'https://ldp-server2.test/users/', {
      fixture: 'users-nantes.jsonld',
    });
    cy.intercept('GET', '**/users/jbpasquier/', {
      fixture: 'users-jbpasquier.jsonld',
    });
    cy.intercept('GET', '**/profiles/jbpasquier/', {
      fixture: 'profiles-jbpasquier.jsonld',
    });
    cy.intercept('GET', '**/users/alex/', {
      fixture: 'users-alex.jsonld',
    });
    cy.intercept('GET', '**/profiles/alex/', {
      fixture: 'profiles-alex.jsonld',
    });

    cy.intercept('PATCH', '**/users/matthieu/', {
      headers: {
        'content-type': 'application/ld+json',
      },
    });

    cy.intercept('POST', 'https://ldp-server.test/users/', {
      headers: {
        'content-type': 'application/ld+json',
      },
    });

    cy.intercept('DELETE', '**/users/alex/', {
      headers: {
        'content-type': 'application/ld+json',
      },
    });

    // Fill matthieu's form
    cy.get('solid-form#user-form input[name="first_name"]')
      .clear()
      .type('Test');
    cy.get('solid-form#user-form input[name="last_name"]').clear().type('User');
    cy.get('solid-form#user-form input[name="username"]').clear().type('admin');

    cy.get('solid-form#user-form input[type=submit]').click();

    // Single solid-display
    cy.get(
      'solid-display#user > div > solid-display-value[name="first_name"]',
    ).should('contain', 'Test');
    cy.get(
      'solid-display#user > div > solid-display-value[name="last_name"]',
    ).should('contain', 'User');
    cy.get(
      'solid-display#user > div > solid-display-value[name="username"]',
    ).should('contain', 'admin');

    // List solid-display & range
    const src = 'https://ldp-server.test/users/matthieu/';
    cy.get(
      `solid-display#users solid-display[data-src="${src}"] > div > solid-display-value[name="first_name"]`,
    ).should('contain', 'Test');
    cy.get(
      `solid-display#users solid-display[data-src="${src}"] > div > solid-display-value[name="last_name"]`,
    ).should('contain', 'User');
    cy.get(
      `solid-display#users solid-display[data-src="${src}"] > div > solid-display-value[name="username"]`,
    ).should('contain', 'admin');
    cy.get(`solid-form#range option[value='{"@id": "${src}"}']`).should(
      'contain',
      'Test User',
    );

    // Federation
    cy.get(
      `solid-display#federation solid-display[data-src="${src}"] > div > solid-display-value[name="first_name"]`,
    ).should('contain', 'Test');
    cy.get(
      `solid-display#federation solid-display[data-src="${src}"] > div > solid-display-value[name="last_name"]`,
    ).should('contain', 'User');
    cy.get(
      `solid-display#federation solid-display[data-src="${src}"] > div > solid-display-value[name="username"]`,
    ).should('contain', 'admin');

    // Fill new user form
    cy.get('solid-form#users-form input[name="first_name"]')
      .clear()
      .type('Alex');
    cy.get('solid-form#users-form input[name="last_name"]')
      .clear()
      .type('Bourlier');
    cy.get('solid-form#users-form input[name="username"]').clear().type('alex');

    cy.get('solid-form#users-form input[type=submit]').click();

    // List solid-display & range
    const newSrc = 'https://ldp-server.test/users/alex/';
    cy.get('solid-display#users solid-display').should('have.length', 3);
    cy.get(
      `solid-display#users solid-display[data-src="${newSrc}"] > div > solid-display-value[name="first_name"]`,
    ).should('contain', 'Alex');
    cy.get(
      `solid-display#users solid-display[data-src="${newSrc}"] > div > solid-display-value[name="last_name"]`,
    ).should('contain', 'Bourlier');
    cy.get(
      `solid-display#users solid-display[data-src="${newSrc}"] > div > solid-display-value[name="username"]`,
    ).should('contain', 'alex');
    cy.get('solid-form#range option').should('have.length', 4);

    // Federation
    cy.get(
      `solid-display#federation solid-display[data-src="${newSrc}"] > div > solid-display-value[name="first_name"]`,
    ).should('contain', 'Alex');
    cy.get(
      `solid-display#federation solid-display[data-src="${newSrc}"] > div > solid-display-value[name="last_name"]`,
    ).should('contain', 'Bourlier');
    cy.get(
      `solid-display#federation solid-display[data-src="${newSrc}"] > div > solid-display-value[name="username"]`,
    ).should('contain', 'alex');

    // delete user & range
    cy.intercept('GET', 'https://ldp-server.test/users/', {
      fixture: 'users-paris.jsonld',
    });
    cy.get('solid-delete#delete-user > button').click();
    cy.get('solid-display#users solid-display').should('have.length', 2);
    cy.get('solid-form#range option').should('have.length', 3);
    // cy.get(`solid-display#federation solid-display`).should('have.length', 3); NOT WORKING: should we loop on subscription index?
  });

  it('makes virtual containers reactive', () => {
    cy.intercept('GET', '**/users/matthieu/circles/', {
      fixture: 'users-matthieu-circles-edited.jsonld',
    });
    cy.intercept('GET', '**/circles/17/members/', {
      fixture: 'circles-17-members.jsonld',
    });

    cy.intercept('POST', 'https://ldp-server.test/circles/17/members/', {
      headers: {
        'content-type': 'application/ld+json',
      },
    });

    cy.get('solid-form#circles-user-form input[name="name"]')
      .clear()
      .type('New circle');
    cy.get('solid-form#circles-user-form input[type=submit]').click();
    cy.get('solid-display#circles-user solid-display').should('have.length', 2);
  });
});
