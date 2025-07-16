// const baseUrl = Cypress.config().baseUrl;

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
  geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
  lat: 'geo:lat',
  lng: 'geo:long',
};

describe('Store skipFetch parameter', { testIsolation: false }, () => {
  beforeEach(() => {
    cy.visit('/examples/e2e/store.html');
  });

  describe('post() method with skipFetch', () => {
    it('should not call getData when skipFetch is true', () => {
      cy.intercept('POST', '/examples/data/list/users.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          Location: '/examples/data/list/user-new.jsonld',
          'access-control-expose-headers': 'Location',
          'access-control-allow-origin': '*',
        },
        body: '',
      }).as('postRequest');

      cy.window().then((win: any) => {
        const store = win.sibStore;
        cy.spy(store, 'getData').as('getDataSpy');
        cy.spy(store, 'clearCache').as('clearCacheSpy');
        cy.spy(store, 'refreshResources').as('refreshResourcesSpy');
        cy.spy(store, 'notifyResources').as('notifyResourcesSpy');
      });

      cy.window().then((win: any) => {
        return win.sibStore
          .post(
            {
              '@type': 'foaf:user',
              name: 'New User',
              '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
            },
            '/examples/data/list/users.jsonld',
            true,
          )
          .then((result: string) => {
            expect(result).to.equal('/examples/data/list/user-new.jsonld');
          });
      });

      cy.wait('@postRequest');

      cy.get('@getDataSpy').should('not.have.been.called');
      cy.get('@clearCacheSpy').should('not.have.been.called');
      cy.get('@refreshResourcesSpy').should('not.have.been.called');
      cy.get('@notifyResourcesSpy').should('not.have.been.called');
    });

    it('should call getData when skipFetch is false (default)', () => {
      cy.intercept('POST', '/examples/data/list/users.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          Location: '/examples/data/list/user-new.jsonld',
          'access-control-expose-headers': 'Location',
          'access-control-allow-origin': '*',
        },
        body: '',
      }).as('postRequest');

      cy.intercept('GET', '/examples/data/list/users.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
        body: {
          '@id': '/examples/data/list/users.jsonld',
          '@type': 'ldp:Container',
          'ldp:contains': [],
          '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        },
      }).as('getRequest');

      cy.window().then((win: any) => {
        const store = win.sibStore;
        cy.spy(store, 'getData').as('getDataSpy');
        cy.spy(store, 'clearCache').as('clearCacheSpy');
      });

      cy.window().then((win: any) => {
        return win.sibStore
          .post(
            {
              '@type': 'foaf:user',
              name: 'New User',
              '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
            },
            '/examples/data/list/users.jsonld',
            false,
          )
          .then((location: string) => {
            expect(location).to.equal('/examples/data/list/user-new.jsonld');
          });
      });

      cy.wait('@postRequest');
      cy.wait('@getRequest');

      cy.get('@getDataSpy').should('have.been.called');
      cy.get('@clearCacheSpy').should('have.been.called');
    });

    it('should call getData when skipFetch is not provided (default behavior)', () => {
      cy.intercept('POST', '/examples/data/list/users.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          Location: '/examples/data/list/user-new.jsonld',
          'access-control-expose-headers': 'Location',
          'access-control-allow-origin': '*',
        },
        body: '',
      }).as('postRequest');

      cy.intercept('GET', '/examples/data/list/users.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
        body: {
          '@id': '/examples/data/list/users.jsonld',
          '@type': 'ldp:Container',
          'ldp:contains': [],
          '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        },
      }).as('getRequest');

      cy.window().then((win: any) => {
        const store = win.sibStore;
        cy.spy(store, 'getData').as('getDataSpy');
        cy.spy(store, 'clearCache').as('clearCacheSpy');
      });

      cy.window().then((win: any) => {
        const store = win.sibStore;
        const resource = {
          '@type': 'foaf:user',
          name: 'New User',
          '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        };
        return store
          .post(resource, '/examples/data/list/users.jsonld')
          .then((location: string) => {
            expect(location).to.equal('/examples/data/list/user-new.jsonld');
          });
      });

      cy.wait('@postRequest');
      cy.wait('@getRequest');

      cy.get('@getDataSpy').should('have.been.called');
      cy.get('@clearCacheSpy').should('have.been.called');
    });
  });

  describe('put() method with skipFetch', () => {
    it('should not call getData when skipFetch is true', () => {
      cy.intercept('PUT', '/examples/data/list/user-1.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
        body: '',
      }).as('putRequest');

      cy.window().then((win: any) => {
        const store = win.sibStore;
        cy.spy(store, 'getData').as('getDataSpy');
        cy.spy(store, 'clearCache').as('clearCacheSpy');
        cy.spy(store, 'refreshResources').as('refreshResourcesSpy');
        cy.spy(store, 'notifyResources').as('notifyResourcesSpy');
      });

      cy.window().then((win: any) => {
        return win.sibStore
          .put(
            {
              '@id': '/examples/data/list/user-1.jsonld',
              '@type': 'foaf:user',
              name: 'Updated User',
              '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
            },
            '/examples/data/list/user-1.jsonld',
            true,
          )
          .then((result: string) => {
            expect(result).to.be.null;
          });
      });

      cy.wait('@putRequest');

      cy.get('@getDataSpy').should('not.have.been.called');
      cy.get('@clearCacheSpy').should('not.have.been.called');
      cy.get('@refreshResourcesSpy').should('not.have.been.called');
      cy.get('@notifyResourcesSpy').should('not.have.been.called');
    });

    it('should call getData when skipFetch is false', () => {
      cy.intercept('PUT', '/examples/data/list/user-1.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
        body: '',
      }).as('putRequest');

      cy.intercept('GET', '/examples/data/list/user-1.jsonld', {
        statusCode: 200,
        body: {
          '@id': '/examples/data/list/user-1.jsonld',
          '@type': 'foaf:user',
          name: 'Updated User',
          '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        },
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
      }).as('getRequest');

      cy.window().then((win: any) => {
        const store = win.sibStore;
        cy.spy(store, 'getData').as('getDataSpy');
        cy.spy(store, 'clearCache').as('clearCacheSpy');
      });

      cy.window().then((win: any) => {
        return win.sibStore
          .put(
            {
              '@id': '/examples/data/list/user-1.jsonld',
              '@type': 'foaf:user',
              name: 'Updated User',
              '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
            },
            '/examples/data/list/user-1.jsonld',
            false,
          )
          .then((result: string) => {
            expect(result).to.be.null;
          });
      });

      cy.wait('@putRequest');
      cy.wait('@getRequest');

      cy.get('@getDataSpy').should('have.been.called');
      cy.get('@clearCacheSpy').should('have.been.called');
    });
  });

  describe('patch() method with skipFetch', () => {
    it('should not call getData when skipFetch is true', () => {
      cy.intercept('PATCH', '/examples/data/list/user-1.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
        body: '',
      }).as('patchRequest');

      cy.window().then((win: any) => {
        const store = win.sibStore;
        cy.spy(store, 'getData').as('getDataSpy');
        cy.spy(store, 'clearCache').as('clearCacheSpy');
        cy.spy(store, 'refreshResources').as('refreshResourcesSpy');
        cy.spy(store, 'notifyResources').as('notifyResourcesSpy');
        cy.spy(store, 'getNestedResources').as('getNestedResourcesSpy');
      });

      cy.window().then((win: any) => {
        return win.sibStore
          .patch(
            {
              name: 'Patched User',
              '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
            },
            '/examples/data/list/user-1.jsonld',
            true,
          )
          .then((result: string) => {
            expect(result).to.be.null;
          });
      });

      cy.wait('@patchRequest');

      cy.get('@getDataSpy').should('not.have.been.called');
      cy.get('@clearCacheSpy').should('not.have.been.called');
      cy.get('@refreshResourcesSpy').should('not.have.been.called');
      cy.get('@notifyResourcesSpy').should('not.have.been.called');
      cy.get('@getNestedResourcesSpy').should('not.have.been.called');
    });

    it('should call getData when skipFetch is false', () => {
      cy.intercept('PATCH', '/examples/data/list/user-1.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
        body: '',
      }).as('patchRequest');

      cy.intercept('GET', '/examples/data/list/user-1.jsonld', {
        statusCode: 200,
        body: {
          '@id': '/examples/data/list/user-1.jsonld',
          '@type': 'foaf:user',
          name: 'Patched User',
          '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        },
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
      }).as('getRequest');

      // 1) заводим спаи
      cy.window().then((win: any) => {
        const store = win.sibStore;
        cy.spy(store, 'getData').as('getDataSpy');
        cy.spy(store, 'clearCache').as('clearCacheSpy');
        cy.spy(store, 'getNestedResources').as('getNestedResourcesSpy');
      });

      cy.window().then((win: any) => {
        return win.sibStore
          .patch(
            {
              name: 'Patched User',
              '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
            },
            '/examples/data/list/user-1.jsonld',
            false,
          )
          .then((result: string) => {
            expect(result).to.be.null;
          });
      });

      cy.wait('@patchRequest');
      cy.wait('@getRequest');

      cy.get('@getDataSpy').should('have.been.called');
      cy.get('@clearCacheSpy').should('have.been.called');
      cy.get('@getNestedResourcesSpy').should('have.been.called');
    });
  });

  describe('setLocalData() method with skipFetch', () => {
    it('should call getData and clearCache when skipFetch is true', () => {
      cy.intercept('GET', 'https://cdn.startinblox.com/owl/context.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
        body: {
          '@context': {
            foaf: 'http://xmlns.com/foaf/0.1/',
          },
        },
      }).as('contextRequest');
      cy.window().then((win: any) => {
        const store = win.sibStore;
        cy.spy(store, 'getData').as('getDataSpy');
        cy.spy(store, 'clearCache').as('clearCacheSpy');
      });

      cy.window().then((win: any) => {
        const store = win.sibStore;
        const resource = {
          '@type': 'foaf:user',
          name: 'Local User',
          '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        };
        cy.wrap(
          store.setLocalData(resource, 'store://local.test', true),
        ).should('be.null');
      });

      cy.wait('@contextRequest');

      cy.get('@getDataSpy').should('have.been.called');
      cy.get('@clearCacheSpy').should('have.been.called');
    });

    it('should call getData and clearCache when skipFetch is false', () => {
      cy.intercept('GET', 'https://cdn.startinblox.com/owl/context.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
        body: { '@context': {} },
      }).as('contextRequest');

      cy.window().then((win: any) => {
        const store = win.sibStore;
        cy.spy(store, 'getData').as('getDataSpy');
        cy.spy(store, 'clearCache').as('clearCacheSpy');
      });

      cy.window().then((win: any) => {
        const store = win.sibStore;
        const resource = {
          '@type': 'foaf:user',
          name: 'Local User',
          '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        };
        cy.wrap(
          store.setLocalData(resource, 'store://local.test', false),
        ).should('be.null');
      });

      cy.wait('@contextRequest');

      cy.get('@getDataSpy').should('have.been.called');
      cy.get('@clearCacheSpy').should('have.been.called');
    });

    it('should maintain resource in cache after setLocalData with skipFetch==true', () => {
      cy.window().then((win: any) => {
        const localId = 'store://local.testcache';

        return win.sibStore
          .setLocalData(
            {
              '@type': 'foaf:user',
              label: 'Local User Test',
              '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
            },
            localId,
            true,
          )
          .then(async () => {
            const cachedResource = await win.sibStore.get(localId);
            expect(cachedResource).to.exist;
            return cachedResource.label;
          })
          .then((name: string) => {
            expect(name).to.equal('Local User Test');
          });
      });
    });
  });

  describe('Performance tests', () => {
    it('should be faster with skipFetch=true', () => {
      cy.intercept('POST', '/examples/data/list/users.jsonld', {
        statusCode: 200,
        headers: {
          'content-type': 'application/ld+json',
          Location: '/examples/data/list/user-new.jsonld',
        },
      }).as('postRequest');

      cy.intercept('GET', '/examples/data/list/users.jsonld', {
        statusCode: 200,
        body: {
          '@id': '/examples/data/list/users.jsonld',
          '@type': 'ldp:Container',
          'ldp:contains': [],
          '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        },
        headers: {
          'content-type': 'application/ld+json',
        },
      }).as('getRequest');

      cy.window().then(async (win: any) => {
        const store = win.sibStore;

        const resource = {
          '@type': 'foaf:user',
          name: 'Performance Test User',
          '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        };

        const startSkip = performance.now();
        await store.post(resource, '/examples/data/list/users.jsonld', true);
        const endSkip = performance.now();
        const timeWithSkip = endSkip - startSkip;

        const startNoSkip = performance.now();
        await store.post(resource, '/examples/data/list/users.jsonld', false);
        const endNoSkip = performance.now();
        const timeWithoutSkip = endNoSkip - startNoSkip;

        expect(timeWithSkip).to.be.lessThan(timeWithoutSkip);
      });
    });
  });

  describe('Error handling with skipFetch', () => {
    it('should handle errors properly when skipFetch is true', () => {
      cy.intercept('POST', '/examples/data/list/users.jsonld', {
        statusCode: 400,
        headers: {
          'content-type': 'application/ld+json',
          'access-control-allow-origin': '*',
        },
        body: { error: 'Bad Request' },
      }).as('postErrorRequest');

      cy.window().then((win: any) => {
        const store = win.sibStore;
        const resource = {
          '@type': 'foaf:user',
          name: 'Error User',
          '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        };
        return store
          .post(resource, '/examples/data/list/users.jsonld', true)
          .then(
            () => {
              throw new Error('Expected store.post() to throw an error');
            },
            (err: any) => {
              expect(err).to.exist;
              expect(err.status).to.equal(400);
            },
          );
      });

      cy.wait('@postErrorRequest');
    });
  });
});
