const baseUrl = Cypress.config().baseUrl;

export const base_context = {
  '@vocab': 'http://happy-dev.fr/owl/#',
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
describe.skip('store', { testIsolation: false }, function () {
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
      const dataToSave1 = {foo: 'bar'};
      const customID = "myCustomID";
      const url = `store://local.${customID}`
      await store.setLocalData(dataToSave1, url);
      const dataRead1 = await store.getData(url);
      console.log(await dataRead1!['foo']);
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
        "@context": "https://cdn.happy-dev.fr/owl/hdcontext.jsonld"
      }
      await store.setLocalData(dataToSave1, '/examples/data/list/user-1.jsonld');
      const dataRead = store.get('/examples/data/list/user-1.jsonld');
      expect(await dataRead['username']).eq('local user');
      expect(await dataRead['email']).not.exist;
      store.clearCache('/examples/data/list/user-1.jsonld');
    });
  });

  it('fetches data and cache it', () => {
    cy.intercept("GET", "*/data/list/users.jsonld").as('users')

    cy.window()
      .its('sibStore')
      .invoke('getData', '../data/list/users.jsonld', base_context);

    // TODO: work in progress
    cy.get('@users').its("response.statusCode").should('equal', 200);
    // cy.get('@users').its("response.statusCode").should('be.oneOf', [200, 304]);
    // cy.get('@users').should('have.property', 'status', 200)

    cy.window()
      .its('sibStore.cache').should('have.length', 6); // cache
    cy.window()
      .its('sibStore.loadingList').should('have.property', 'size', 0); // loading list
    cy.window()
      .its('sibStore.subscriptionIndex').should('have.length', 4); // loading list

    cy.window()
      .its('sibStore')
      .invoke('get', '../data/list/users.jsonld')
      .should('exist');

    // properties are expanded
    cy.window()
      .its('sibStore')
      .invoke('getData', '../data/extra-context/user-6.jsonld', base_context);
    cy.window()
      .its('sibStore')
      .invoke('get', '../data/extra-context/user-6.jsonld')
      .invoke('getResourceData')
      .should('have.property', 'http://happy-dev.fr/owl/#email', "test-user@example.com"); // @vocab
    cy.window()
      .its('sibStore')
      .invoke('get', 'profile-6.jsonld')
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

    cy.intercept("GET", "/examples/data/list/user-1.jsonld", {
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
      .its('sibStore.cache').should('have.length', 10);

    cy.window()
      .its('sibStore')
      .invoke('get', '/examples/data/list/user-1.jsonld')
      .should('exist');

    cy.window()
      .its('sibStore')
      .invoke('clearCache', '/examples/data/list/user-1.jsonld');

    cy.window()
      .its('sibStore.cache').should('have.length', 9);

    cy.window()
      .its('sibStore')
      .invoke('get', '/examples/data/list/user-1.jsonld')
      .should('not.exist');

    cy.window()
      .its('sibStore')
      .invoke('clearCache', 'wrong-id.jsonld');

    cy.window()
      .its('sibStore.cache').should('have.length', 9);
  });

  it('subscribes resource', () => {
    cy.window()
      .its('sibStore')
      .invoke('subscribeResourceTo', 'ldp-server.test/circles/', 'ldp-server.test/circles/1/');

    cy.window().then((win: any) => {
      expect(win.sibStore.subscriptionIndex).to.have.length(5);
      expect(win.sibStore.subscriptionIndex.get('ldp-server.test/circles/1/'))
        .to.have.length(1)
        .and.to.have.members(['ldp-server.test/circles/']);
    });

    cy.window()
      .its('sibStore')
      .invoke('subscribeResourceTo', 'ldp-server.test/users/matthieu/', 'ldp-server.test/circles/1/');

    cy.window().then((win: any) => {
      expect(win.sibStore.subscriptionIndex).to.have.length(5);
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
      .invoke('_getAbsoluteIri', '../data/list/users.jsonld', base_context, '')
      .should('equal', `${baseUrl}/examples/data/list/users.jsonld`);

    cy.window()
      .its('sibStore')
      .invoke('_getAbsoluteIri', 'user-1.jsonld', base_context, '../data/list/users.jsonld')
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
        "@id": "user-1.jsonld",
        name: "Test User",
        available: true,
        skills: {
          "@id": "user-1-skills.jsonld",
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
          "@id": "profile-1.jsonld"
        },
        "@type": "foaf:user"
      };
      const nestedResources = await store.getNestedResources(resource, '/examples/data/list/user-1.jsonld');
      expect(nestedResources).to.deep.equal(["user-1-skills.jsonld", "profile-1.jsonld"]);
      expect(store.fetchData).to.be.calledOnce;
    });
  });

  it('refreshResource', () => {
    cy.window().then(async (win: any) => {
      const store = win.sibStore;
      cy.spy(store, 'clearCache');
      cy.spy(store, 'getData');
      cy.spy(store, 'fetchData');

      expect(store.cache).to.have.length(10);
      await store.refreshResources(['/examples/data/list/user-1.jsonld', '/examples/data/list/users.jsonld']);

      expect(store.clearCache).to.be.calledTwice;
      expect(store.getData).to.be.calledTwice;
      expect(store.fetchData).to.be.calledTwice;

      expect(store.cache).to.have.length(10);
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
        "@context": "https://cdn.happy-dev.fr/owl/hdcontext.jsonld",
        "@id": "store://local.2",
        "name": "ok",
      }, "store://local.2");

      await store.setLocalData({
        "@context": "https://cdn.happy-dev.fr/owl/hdcontext.jsonld",
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