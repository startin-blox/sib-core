const baseUrl = Cypress.config().baseUrl;

export const base_context = {
  '@vocab': 'https://cdn.startinblox.com/owl#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  ldp: 'http://www.w3.org/ns/ldp#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  name: 'rdfs:label',
  acl: 'http://www.w3.org/ns/auth/acl#',
  permissions: 'acl:accessControl',
  mode: 'acl:mode',
  geo: "http://www.w3.org/2003/01/geo/wgs84_pos#",
  lat: "geo:lat",
  lng: "geo:long"
};

// FIXME: Fix this tests suite
describe('store', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/store.html')
  })

  it('has prototype', () => {
    cy.window().then((win: any) => {
      // properties
      expect(win.sibStore.cache).to.exist;
      expect(win.sibStore.subscriptionIndex).to.exist;
      expect(win.sibStore.loadingList).to.be.a('Set').and.have.property('size', 0);
      expect(win.sibStore.headers).to.exist;
      // public methods
      expect(win.sibStore.fetchAuthn).to.be.a('function');
      expect(win.sibStore.getData).to.be.a('function');
      expect(win.sibStore.setLocalData).to.be.a('function');
      expect(win.sibStore.get).to.be.a('function');
      expect(win.sibStore.clearCache).to.be.a('function');
      expect(win.sibStore.post).to.be.a('function');
      expect(win.sibStore.put).to.be.a('function');
      expect(win.sibStore.patch).to.be.a('function');
      expect(win.sibStore.delete).to.be.a('function');
      expect(win.sibStore.selectLanguage).to.be.a('function');
      // PubSub
      expect(win.PubSub).to.exist;
    })
  });

  it('save local data', () => {
    cy.window().then(async (win: any) => {
      const store = win.sibStore;
      const customID = "myCustomID";
      const url = `store://local.${customID}`

      // Now the context needs to be explicitly defined
      const dataToSave1 = {
        foo: 'bar',
        "@context": "https://cdn.startinblox.com/owl/context.jsonld"
      };
      await store.setLocalData(dataToSave1, url);
      let dataRead1 = await store.getData(url);
      expect(await dataRead1!['foo']).eq('bar');
      store.clearCache(url);
    });
  });

  it('replaces local data', () => {
    cy.intercept("GET", "*/data/list/users.jsonld").as('users')

    cy.window().then(async (win: any) => {
      const store = win.sibStore;
      await store.getData('/examples/data/list/user-1.jsonld', base_context);
      const dataToSave1 = {
        "@id": "/examples/data/list/user-1.jsonld",
        "@type": "foaf:user",
        "username": "local user",
        "@context": "https://cdn.startinblox.com/owl/context.jsonld"
      }
      await store.setLocalData(dataToSave1, '/examples/data/list/user-1.jsonld');
      const dataRead = store.get('/examples/data/list/user-1.jsonld');
      expect(await dataRead['username']).eq('local user');
      expect(await dataRead['email']).not.exist;
      store.clearCache('/examples/data/list/user-1.jsonld');
    });
  });

  it('fetches data and cache it', () => {
    cy.intercept("GET", "/examples/data/list/users.jsonld", {
      statusCode: 200,
      body: {
        "@id": "/examples/data/list/users.jsonld",
        "@type": "ldp:Container",
        "ldp:contains": [
          {
            "@id": "/examples/data/list/user-1.jsonld",
            "first_name": "Test",
            "last_name": "User",
            "name": "Test User",
            "username": "admin",
            "email": "test-user@example.com",
            "available": true,
            "years_experience": 3,
            "skills": {
              "@id": "/examples/data/list/user-1-skills.jsonld",
              "@type": "ldp:Container",
              "ldp:contains": [
                {
                  "@id": "/examples/data/list/skill-2.jsonld"
                },
                {
                  "@id": "/examples/data/list/skill-3.jsonld"
                }
              ],
              "permissions": [
                "view"
              ]
            },
            "profile": {
              "@id": "/examples/data/list/profile-1.jsonld"
            },
            "@type": "foaf:user",
            "permissions": [
              "view"
            ]
          },
          {
            "@id": "/examples/data/list/user-2.jsonld",
            "first_name": "Paris",
            "last_name": "Hilton",
            "name": "Paris Hilton",
            "username": "paris",
            "email": "paris@hilton.hi",
            "available": true,
            "years_experience": 5,
            "skills": {
              "@id": "/examples/data/list/user-2-skills.jsonld",
              "@type": "ldp:Container",
              "ldp:contains": [
                {
                  "@id": "/examples/data/list/skill-1.jsonld"
                }
              ],
              "permissions": [
                "view"
              ]
            },
            "profile": {
              "@id": "/examples/data/list/profile-2.jsonld"
            },
            "@type": "foaf:user",
            "permissions": [
              "view"
            ]
          },
          {
            "@id": "/examples/data/list/user-4.jsonld",
            "first_name": "Pierre",
            "last_name": "DLC",
            "name": "Pierre DLC",
            "username": "pierre",
            "email": "pierredelacroix@happy-dev.fr",
            "available": false,
            "years_experience": 5,
            "skills": {
              "@id": "/examples/data/list/user-4-skills.jsonld",
              "@type": "ldp:Container",
              "ldp:contains": [
                {
                  "@id": "/examples/data/list/skill-1.jsonld"
                },
                {
                  "@id": "/examples/data/list/skill-2.jsonld"
                },
                {
                  "@id": "/examples/data/list/skill-4.jsonld"
                }
              ],
              "permissions": [
                "view"
              ]
            },
            "profile": {
              "@id": "/examples/data/list/profile-4.jsonld"
            },
            "@type": "foaf:user",
            "permissions": [
              "view"
            ]
          },
          {
            "@id": "/examples/data/list/user-3.jsonld",
            "first_name": "Not A",
            "last_name": "Paris Member",
            "name": "Not A Paris Member",
            "username": "not-member-paris",
            "email": "not-a@paris.members",
            "available": false,
            "years_experience": 7,
            "skills": {
              "@id": "/examples/data/list/user-3-skills.jsonld",
              "@type": "ldp:Container",
              "ldp:contains": [
      
              ],
              "permissions": [
                "view"
              ]
            },
            "profile": {
              "@id": "/examples/data/list/profile-3.jsonld"
            },
            "@type": "foaf:user",
            "permissions": [
              "view"
            ]
          }
        ],
        "permissions": [
          "view"
        ],
        "@context": "https://cdn.startinblox.com/owl/context.jsonld"
      },
      headers: {
        'content-type': 'application/ld+json'
      }
    }).as('users')

    cy.intercept("GET", "/examples/data/extra-context/user-6.jsonld", {
      statusCode: 200,
      body: {
        "@id": "/examples/data/extra-context/user-6.jsonld",
        "first_name": "Test",
        "last_name": "User",
        "username": "admin",
        "email": "test-user@example.com",
        "name": "Test User",
        "profile": {
          "@id": "/examples/data/extra-context/profile-6.jsonld",
          "@context": {
            "picture": "foaf:depiction"
          },
          "picture": "my-avatar.png"
        },
        "@type": "foaf:user",
        "permissions": [
          "view"
        ],
        "@context": "https://cdn.startinblox.com/owl/context.jsonld"
      },
      headers: {
        'content-type': 'application/ld+json'
      }
    }).as('user-6')

    cy.window()
      .its('sibStore')
      .invoke('getData', '/examples/data/list/users.jsonld', base_context);

    cy.get('@users').its("response.statusCode").should('equal', 200);

    cy.window()
      .its('sibStore.cache').should('have.length', 13); // cache
    cy.window()
      .its('sibStore.loadingList').should('have.property', 'size', 0); // loading list
    cy.window()
      .its('sibStore.subscriptionIndex').should('have.length', 8); // Subscription index

    cy.window()
      .its('sibStore')
      .invoke('get', '/examples/data/list/users.jsonld')
      .should('exist');

    // properties are expanded
    cy.window()
      .its('sibStore')
      .invoke('getData', '/examples/data/extra-context/user-6.jsonld', base_context);
    cy.window()
      .its('sibStore')
      .invoke('get', '/examples/data/extra-context/user-6.jsonld')
      .invoke('getResourceData')
      .should('have.property', 'https://cdn.startinblox.com/owl#email', "test-user@example.com"); // @vocab
    cy.window()
      .its('sibStore')
      .invoke('get', '/examples/data/extra-context/profile-6.jsonld')
      .invoke('getResourceData')
      .should('have.property', 'http://xmlns.com/foaf/0.1/depiction', "my-avatar.png"); // nested additionnal context
  });

  it('send xhr requests', () => {
    cy.intercept("PATCH", "/examples/data/list/user-1.jsonld", {
      headers: {
        'content-type': 'application/ld+json'
      }
    }).as("patch")
    
    cy.intercept("PUT", "/examples/data/list/user-1.jsonld", {
      headers: {
        'content-type': 'application/ld+json'
      }
    }).as("put")
    
    cy.intercept("POST", "/examples/data/list/users.jsonld", {
      headers: {
        'content-type': 'application/ld+json'
      }
    }).as("post")

    cy.intercept("DELETE", "/examples/data/list/user-1.jsonld", {
      headers: {
        'content-type': 'application/ld+json'
      }
    }).as("delete")

    cy.intercept("GET", `${baseUrl}/examples/data/list/user-1.jsonld`, {
      statusCode: 200,
      body: {
          "@id": "/examples/data/list/user-1.jsonld",
          "@type": "foaf:user",
          "first_name": "Matthieu",
          "last_name": "Garcia",
          "email": "matthieu@example.com"
      },
      headers: {
        'content-type': 'application/ld+json'
      }
    }).as("get")

    cy.window().then((win: any) => {
      cy.spy(win.sibStore, 'clearCache');
      cy.spy(win.PubSub, 'publish');
    });

    cy.window()
      .its('sibStore')
      .invoke('fetchData', '/examples/data/list/user-1.jsonld');
    cy.get('@get').its("request.url").should('equal', `${baseUrl}/examples/data/list/user-1.jsonld`);
    
    cy.window()
      .its('sibStore')
      .invoke('patch', { first_name: 'Monsieur' }, '/examples/data/list/user-1.jsonld');
    cy.get('@patch').its("request.url").should('equal', `${baseUrl}/examples/data/list/user-1.jsonld`);

    cy.window()
      .its('sibStore')
      .invoke('put', { first_name: 'Monsieur' }, '/examples/data/list/user-1.jsonld');
    cy.get('@put').its("request.url").should('equal', `${baseUrl}/examples/data/list/user-1.jsonld`);

    cy.window()
      .its('sibStore')
      .invoke('post', { first_name: 'Monsieur' }, '/examples/data/list/users.jsonld');
    cy.get('@post').its("request.url").should('equal', `${baseUrl}/examples/data/list/users.jsonld`);

    cy.window()
      .its('sibStore')
      .invoke('delete', '/examples/data/list/user-1.jsonld');
    cy.get('@delete').its("request.url").should('equal', `${baseUrl}/examples/data/list/user-1.jsonld`);

    cy.window().then((win: any) => {
      expect(win.sibStore.clearCache).to.be.called;
      expect(win.PubSub.publish).to.be.called;
    });
  });

  it('expands id', () => {
    cy.window()
      .its('sibStore')
      .invoke('_getExpandedId', 'user:1/', { 'user': "https://ldp-server.test/users/" })
      .should('equal', 'https://ldp-server.test/users/1/');

    cy.window()
      .its('sibStore')
      .invoke('_getExpandedId', 'user:1/', {})
      .should('equal', 'user:1/');

    cy.window()
      .its('sibStore')
      .invoke('_getExpandedId', 'user:1/', null)
      .should('equal', 'user:1/');
  });

  it('clears cache', () => {
    cy.window()
      .its('sibStore.cache').should('have.length', 15);

    cy.window()
      .its('sibStore')
      .invoke('get', '/examples/data/list/user-1.jsonld')
      .should('exist');

    cy.window()
      .its('sibStore')
      .invoke('clearCache', '/examples/data/list/user-1.jsonld');

    cy.window()
      .its('sibStore.cache').should('have.length', 14);

    cy.window()
      .its('sibStore')
      .invoke('get', '/examples/data/list/user-1.jsonld')
      .should('not.exist');

    cy.window()
      .its('sibStore')
      .invoke('clearCache', 'wrong-id.jsonld');

    cy.window()
      .its('sibStore.cache').should('have.length', 14);
  });

  it('subscribes resource', () => {
    cy.window()
      .its('sibStore')
      .invoke('subscribeResourceTo', 'ldp-server.test/circles/', 'ldp-server.test/circles/1/');

    cy.window().then((win: any) => {
      expect(win.sibStore.subscriptionIndex).to.have.length(9);
      expect(win.sibStore.subscriptionIndex.get('ldp-server.test/circles/1/'))
        .to.have.length(1)
        .and.to.have.members(['ldp-server.test/circles/']);
    });

    cy.window()
      .its('sibStore')
      .invoke('subscribeResourceTo', 'ldp-server.test/users/matthieu/', 'ldp-server.test/circles/1/');

    cy.window().then((win: any) => {
      expect(win.sibStore.subscriptionIndex).to.have.length(9);
      expect(win.sibStore.subscriptionIndex.get('ldp-server.test/circles/1/'))
        .to.have.length(2)
        .and.to.have.members(['ldp-server.test/circles/', 'ldp-server.test/users/matthieu/']);
    });
  });

  it('subscribes virtual container', () => {
    cy.window()
      .its('sibStore')
      .invoke('subscribeVirtualContainerTo', 'ldp-server.test/circles/joinable', 'ldp-server.test/circles/1/members');

    cy.window().then((win: any) => {
      expect(win.sibStore.subscriptionVirtualContainersIndex).to.have.length(1);
      expect(win.sibStore.subscriptionVirtualContainersIndex.get('ldp-server.test/circles/1/members'))
        .to.have.length(1)
        .and.to.have.members(['ldp-server.test/circles/joinable']);
    });

    cy.window()
      .its('sibStore')
      .invoke('subscribeVirtualContainerTo', 'ldp-server.test/users/matthieu/circles', 'ldp-server.test/circles/1/members');

    cy.window().then((win: any) => {
      expect(win.sibStore.subscriptionVirtualContainersIndex).to.have.length(1);
      expect(win.sibStore.subscriptionVirtualContainersIndex.get('ldp-server.test/circles/1/members'))
        .to.have.length(2)
        .and.to.have.members(['ldp-server.test/users/matthieu/circles', 'ldp-server.test/circles/joinable']);
    });

    cy.window()
    .its('sibStore')
    .invoke('subscribeVirtualContainerTo', 'ldp-server.test/circles/joinable', 'ldp-server.test/circles/1/members');

    cy.window().then((win: any) => {
      expect(win.sibStore.subscriptionVirtualContainersIndex).to.have.length(1);
      expect(win.sibStore.subscriptionVirtualContainersIndex.get('ldp-server.test/circles/1/members'))
        .to.have.length(2)
        .and.to.have.members(['ldp-server.test/users/matthieu/circles', 'ldp-server.test/circles/joinable']);
    });
  });

  it('gets absolute iri', () => {
    cy.window()
      .its('sibStore')
      .invoke('_getAbsoluteIri', '/examples/data/list/users.jsonld', base_context, '')
      .should('equal', `${baseUrl}/examples/data/list/users.jsonld`);

    cy.window()
      .its('sibStore')
      .invoke('_getAbsoluteIri', 'user-1.jsonld', base_context, '/examples/data/list/users.jsonld')
      .should('equal', `${baseUrl}/examples/data/list/user-1.jsonld`);

    cy.window()
      .its('sibStore')
      .invoke('_getAbsoluteIri', 'https://ldp-server.test/circles/', base_context, '')
      .should('equal', 'https://ldp-server.test/circles/');
  });

  it('getNestedResources', () => {
    cy.window().then(async (win: any) => {
      const store = win.sibStore;
      cy.spy(store, 'fetchData');
      await store.getData('/examples/data/list/user-1.jsonld', base_context);

      const resource = {
        "@id": "/examples/data/list/user-1.jsonld",
        name: "Test User",
        available: true,
        skills: {
          "@id": "/examples/data/list/user-1-skills.jsonld",
          "@type": "ldp:Container",
          "ldp:contains": [
            {
              "@id": "/examples/data/list/skill-2.jsonld"
            },
            {
              "@id": "/examples/data/list/skill-3.jsonld"
            }
          ],
        },
        profile: {
          "@id": "/examples/data/list/profile-1.jsonld"
        },
        "@type": "foaf:user"
      };
      const nestedResources = await store.getNestedResources(resource, '/examples/data/list/user-1.jsonld');
      expect(nestedResources).to.deep.equal(["/examples/data/list/user-1-skills.jsonld", "/examples/data/list/profile-1.jsonld"]);
      expect(store.fetchData).to.be.calledOnce;
    });
  });

  it('refreshResource', () => {
    cy.window().then(async (win: any) => {
      const store = win.sibStore;
      cy.spy(store, 'clearCache');
      cy.spy(store, 'getData');
      cy.spy(store, 'fetchData');

      expect(store.cache).to.have.length(15);
      await store.refreshResources(['/examples/data/list/user-1.jsonld', '/examples/data/list/users.jsonld']);

      expect(store.clearCache).to.be.calledTwice;
      expect(store.getData).to.be.calledTwice;
      expect(store.fetchData).to.be.calledTwice;

      expect(store.cache).to.have.length(15);
    });
  });

  it('notifyResources', () => {
    cy.window().then(async (win: any) => {
      const store = win.sibStore;
      cy.spy(win.PubSub, 'publish');
      await store.notifyResources(['/examples/data/list/user-1.jsonld', '/examples/data/list/users.jsonld']);
      expect(win.PubSub.publish).to.be.calledTwice;
    });
  });

  it('refreshResource and localData', () => {
    cy.window().then(async (win: any) => {
      const store = win.sibStore;
      await store.setLocalData({
        "@context": "https://cdn.startinblox.com/owl/context.jsonld",
        "@id": "store://local.2",
        "name": "ok",
      }, "store://local.2");

      await store.setLocalData({
        "@context": "https://cdn.startinblox.com/owl/context.jsonld",
        "@id": "store://local.1",
        "ref": { "@id": "store://local.2" },
      }, "store://local.1");

      cy.wait(100).then(async () => {
        const resource = store.get('store://local.2')
        expect(resource).to.exist;
        const name = await resource['name']
        expect(name).to.equal('ok');
      } );
    });
  });
});