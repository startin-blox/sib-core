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

describe('store', function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/store.html')
  })

  it('has prototype', () => {
    cy.window().then((win: any) => {
      // properties
      expect(win.store.cache).to.exist;
      expect(win.store.subscriptionIndex).to.exist;
      expect(win.store.loadingList).to.be.a('array').and.have.length(0);
      expect(win.store.headers).to.exist;
      // public methods
      expect(win.store.getData).to.be.a('function');
      expect(win.store.get).to.be.a('function');
      expect(win.store.clearCache).to.be.a('function');
      expect(win.store.post).to.be.a('function');
      expect(win.store.put).to.be.a('function');
      expect(win.store.patch).to.be.a('function');
      expect(win.store.delete).to.be.a('function');
      // PubSub
      expect(win.PubSub).to.exist;
    })
  });

  it('creates headers', () => {
    cy.window().then(async (win: any) => {
      expect(win.store.headers).to.be.a('promise');
      const headers = await win.store.headers;
      expect(headers).to.exist;
      expect(headers.get('Content-Type')).to.equal('application/ld+json');
    });
  });

  it('fetches data and cache it', () => {
    cy.server()
    cy.route('GET', '*/data/list/users.jsonld').as('users')

    cy.window()
      .its('store')
      .invoke('getData', '../data/list/users.jsonld', base_context);

    cy.get('@users').should('have.property', 'status', 200)

    cy.window()
      .its('store.cache').should('have.length', 18); // cache
    cy.window()
      .its('store.loadingList').should('have.length', 0); // loading list
    cy.window()
      .its('store.subscriptionIndex').should('have.length', 4); // loading list

    cy.window()
      .its('store')
      .invoke('get', '../data/list/users.jsonld')
      .should('exist');
  });

  it('send xhr requests', () => {
    cy.server()
    cy.route({
      method: 'PATCH',
      url: '/examples/data/list/user-1.jsonld',
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    }).as('patch');
    cy.route({
      method: 'PUT',
      url: '/examples/data/list/user-1.jsonld',
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    }).as('put');
    cy.route({
      method: 'POST',
      url: '/examples/data/list/users.jsonld',
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    }).as('post');
    cy.route({
      method: 'DELETE',
      url: '/examples/data/list/user-1.jsonld',
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    }).as('delete');
    cy.route({
      method: 'GET',
      url: '/examples/data/list/user-1.jsonld',
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    }).as('get');

    cy.window().then((win: any) => {
      cy.spy(win.store, 'clearCache');
      cy.spy(win.PubSub, 'publish');
    });

    cy.window()
      .its('store')
      .invoke('fetchData', '/examples/data/list/user-1.jsonld');
    cy.get('@get').then((xhr: any) => {
      expect(xhr.method).to.equal('GET');
      expect(xhr.url).to.equal(`${baseUrl}/examples/data/list/user-1.jsonld`);
    });

    cy.window()
      .its('store')
      .invoke('patch', { first_name: 'Monsieur' }, '/examples/data/list/user-1.jsonld');
    cy.get('@patch').then((xhr: any) => {
      expect(xhr.method).to.equal('PATCH');
      expect(xhr.url).to.equal(`${baseUrl}/examples/data/list/user-1.jsonld`);
    });

    cy.window()
      .its('store')
      .invoke('put', { first_name: 'Monsieur' }, '/examples/data/list/user-1.jsonld');
    cy.get('@put').then((xhr: any) => {
      expect(xhr.method).to.equal('PUT');
      expect(xhr.url).to.equal(`${baseUrl}/examples/data/list/user-1.jsonld`);
    });

    cy.window()
      .its('store')
      .invoke('post', { first_name: 'Monsieur' }, '/examples/data/list/users.jsonld');
    cy.get('@post').then((xhr: any) => {
      expect(xhr.method).to.equal('POST');
      expect(xhr.url).to.equal(`${baseUrl}/examples/data/list/users.jsonld`);
    });

    cy.window()
      .its('store')
      .invoke('delete', '/examples/data/list/user-1.jsonld');
    cy.get('@delete').then((xhr: any) => {
      expect(xhr.method).to.equal('DELETE');
      expect(xhr.url).to.equal(`${baseUrl}/examples/data/list/user-1.jsonld`);
    });

    cy.window().then((win: any) => {
      expect(win.store.clearCache).to.be.called;
      expect(win.PubSub.publish).to.be.called;
    });
  });

  it('expands id', () => {
    cy.window()
      .its('store')
      .invoke('_getExpandedId', 'user:1/', { 'user': "https://api.test-paris.happy-dev.fr/users/" })
      .should('equal', 'https://api.test-paris.happy-dev.fr/users/1/');

    cy.window()
      .its('store')
      .invoke('_getExpandedId', 'user:1/', {})
      .should('equal', 'user:1/');

    cy.window()
      .its('store')
      .invoke('_getExpandedId', 'user:1/', null)
      .should('equal', 'user:1/');
  });

  it('clears cache', () => {
    cy.window()
      .its('store.cache').should('have.length', 20);

    cy.window()
      .its('store')
      .invoke('get', '/examples/data/list/user-1.jsonld')
      .should('exist');

    cy.window()
      .its('store')
      .invoke('clearCache', '/examples/data/list/user-1.jsonld');

    cy.window()
      .its('store.cache').should('have.length', 19);

    cy.window()
      .its('store')
      .invoke('get', '/examples/data/list/user-1.jsonld')
      .should('not.exist');

    cy.window()
      .its('store')
      .invoke('clearCache', 'wrong-id.jsonld');

    cy.window()
      .its('store.cache').should('have.length', 19);
  });

  it('subscribes resource', () => {
    cy.window()
      .its('store')
      .invoke('subscribeResourceTo', 'api.alpha.happy-dev.fr/circles/', 'api.alpha.happy-dev.fr/circles/1/');

    cy.window().then((win: any) => {
      expect(win.store.subscriptionIndex).to.have.length(5);
      expect(win.store.subscriptionIndex.get('api.alpha.happy-dev.fr/circles/1/'))
        .to.have.length(1)
        .and.to.have.members(['api.alpha.happy-dev.fr/circles/']);
    });

    cy.window()
      .its('store')
      .invoke('subscribeResourceTo', 'api.alpha.happy-dev.fr/users/matthieu/', 'api.alpha.happy-dev.fr/circles/1/');

    cy.window().then((win: any) => {
      expect(win.store.subscriptionIndex).to.have.length(5);
      expect(win.store.subscriptionIndex.get('api.alpha.happy-dev.fr/circles/1/'))
        .to.have.length(2)
        .and.to.have.members(['api.alpha.happy-dev.fr/circles/', 'api.alpha.happy-dev.fr/users/matthieu/']);
    });
  });

  it('gets absolute iri', () => {
    cy.window()
      .its('store')
      .invoke('_getAbsoluteIri', '../data/list/users.jsonld', base_context, '')
      .should('equal', `${baseUrl}/examples/data/list/users.jsonld`);

    cy.window()
      .its('store')
      .invoke('_getAbsoluteIri', 'user-1.jsonld', base_context, '../data/list/users.jsonld')
      .should('equal', `${baseUrl}/examples/data/list/user-1.jsonld`);

    cy.window()
      .its('store')
      .invoke('_getAbsoluteIri', 'https://api.alpha.happy-dev.fr/circles/', base_context, '')
      .should('equal', 'https://api.alpha.happy-dev.fr/circles/');
  });
});