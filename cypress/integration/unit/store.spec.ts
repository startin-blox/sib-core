import type { Store } from "../../../src/libs/store/store";

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

  it('creates headers', () => {
    cy.window().then(async (win: any) => {
      expect(win.sibStore.headers).to.be.a('promise');
      const headers = await win.sibStore.headers;
      expect(headers).to.exist;
      expect(headers.get('Content-Type')).to.equal('application/ld+json');
    });
  });

  it('save local data', () => {
  cy.window().then(async (win: any) => {
      const store: Store = win.sibStore
      const dataToSave1 = {foo: 'bar'};
      const customID = "myCustomID";
      const url = `store://local.${customID}`
      await store.setLocalData(dataToSave1, customID);
      expect(url).eq(`store://local.${customID}`);
      const dataRead1 = await store.getData(url);
      console.log(await dataRead1!['foo']);
      expect(await dataRead1!['foo']).eq('bar');
      store.clearCache(url);
    });
  });

  it('fetches data and cache it', () => {
    cy.server()
    cy.route('GET', '*/data/list/users.jsonld').as('users')

    cy.window()
      .its('sibStore')
      .invoke('getData', '../data/list/users.jsonld', base_context);

    cy.get('@users').should('have.property', 'status', 200)

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
      cy.spy(win.sibStore, 'clearCache');
      cy.spy(win.PubSub, 'publish');
    });

    cy.window()
      .its('sibStore')
      .invoke('fetchData', '/examples/data/list/user-1.jsonld');
    cy.get('@get').then((xhr: any) => {
      expect(xhr.method).to.equal('GET');
      expect(xhr.url).to.equal(`${baseUrl}/examples/data/list/user-1.jsonld`);
    });

    cy.window()
      .its('sibStore')
      .invoke('patch', { first_name: 'Monsieur' }, '/examples/data/list/user-1.jsonld');
    cy.get('@patch').then((xhr: any) => {
      expect(xhr.method).to.equal('PATCH');
      expect(xhr.url).to.equal(`${baseUrl}/examples/data/list/user-1.jsonld`);
    });

    cy.window()
      .its('sibStore')
      .invoke('put', { first_name: 'Monsieur' }, '/examples/data/list/user-1.jsonld');
    cy.get('@put').then((xhr: any) => {
      expect(xhr.method).to.equal('PUT');
      expect(xhr.url).to.equal(`${baseUrl}/examples/data/list/user-1.jsonld`);
    });

    cy.window()
      .its('sibStore')
      .invoke('post', { first_name: 'Monsieur' }, '/examples/data/list/users.jsonld');
    cy.get('@post').then((xhr: any) => {
      expect(xhr.method).to.equal('POST');
      expect(xhr.url).to.equal(`${baseUrl}/examples/data/list/users.jsonld`);
    });

    cy.window()
      .its('sibStore')
      .invoke('delete', '/examples/data/list/user-1.jsonld');
    cy.get('@delete').then((xhr: any) => {
      expect(xhr.method).to.equal('DELETE');
      expect(xhr.url).to.equal(`${baseUrl}/examples/data/list/user-1.jsonld`);
    });

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
});