/**
 * Validates that store.ts exposes store utilities via window.sib.store namespace
 * and window.sibStore (backward compat), so consumers importing only
 * `@startinblox/core/store` get everything they need.
 */
describe('store.ts global exports', { testIsolation: false }, function () {
  this.beforeAll('visit store.html', () => {
    cy.visit('/examples/e2e/store.html');
  });

  describe('window.sib namespace', () => {
    it('is defined', () => {
      cy.window().then((win: any) => {
        expect(win.sib).to.exist;
        expect(win.sib).to.be.an('object');
      });
    });
  });

  describe('window.sib.store', () => {
    it('is an object with store sub-properties', () => {
      cy.window().then((win: any) => {
        expect(win.sib.store).to.exist;
        expect(win.sib.store).to.be.an('object');
      });
    });
  });

  describe('window.sib.store.ldp', () => {
    it('is a store instance with expected methods', () => {
      cy.window().then((win: any) => {
        expect(win.sib.store.ldp).to.exist;
        expect(win.sib.store.ldp.getData).to.be.a('function');
        expect(win.sib.store.ldp.get).to.be.a('function');
        expect(win.sib.store.ldp.post).to.be.a('function');
        expect(win.sib.store.ldp.put).to.be.a('function');
        expect(win.sib.store.ldp.patch).to.be.a('function');
        expect(win.sib.store.ldp.delete).to.be.a('function');
        expect(win.sib.store.ldp.cache).to.exist;
      });
    });
  });

  describe('window.sib.store.service', () => {
    it('has expected static methods', () => {
      cy.window().then((win: any) => {
        expect(win.sib.store.service).to.exist;
        expect(win.sib.store.service.getInstance).to.be.a('function');
        expect(win.sib.store.service.getStore).to.be.a('function');
        expect(win.sib.store.service.addStore).to.be.a('function');
        expect(win.sib.store.service.setDefaultStore).to.be.a('function');
        expect(win.sib.store.service.init).to.be.a('function');
        expect(win.sib.store.service.getConfig).to.be.a('function');
      });
    });

    it('getInstance returns the same instance as window.sib.store.ldp', () => {
      cy.window().then((win: any) => {
        const instance = win.sib.store.service.getInstance();
        expect(instance).to.equal(win.sib.store.ldp);
      });
    });
  });

  describe('window.sib.store.type', () => {
    it('contains the expected enum values', () => {
      cy.window().then((win: any) => {
        expect(win.sib.store.type).to.exist;
        expect(win.sib.store.type.LDP).to.equal('ldp');
        expect(win.sib.store.type.FederatedCatalogue).to.equal(
          'federatedCatalogue',
        );
        expect(win.sib.store.type.DataspaceConnector).to.equal(
          'dataspaceConnector',
        );
      });
    });
  });

  describe('window.sib.store type guards', () => {
    it('exposes hasQueryIndex, hasSetLocalData, hasQueryIndexConjunction', () => {
      cy.window().then((win: any) => {
        expect(win.sib.store.hasQueryIndex).to.be.a('function');
        expect(win.sib.store.hasSetLocalData).to.be.a('function');
        expect(win.sib.store.hasQueryIndexConjunction).to.be.a('function');
      });
    });

    it('type guards return booleans when called with the store', () => {
      cy.window().then((win: any) => {
        expect(win.sib.store.hasQueryIndex(win.sib.store.ldp)).to.be.a(
          'boolean',
        );
        expect(win.sib.store.hasSetLocalData(win.sib.store.ldp)).to.be.a(
          'boolean',
        );
        expect(
          win.sib.store.hasQueryIndexConjunction(win.sib.store.ldp),
        ).to.be.a('boolean');
      });
    });
  });

  describe('window.sibStore (backward compatibility)', () => {
    it('is still exposed and equals window.sib.store.ldp', () => {
      cy.window().then((win: any) => {
        expect(win.sibStore).to.exist;
        expect(win.sibStore).to.equal(win.sib.store.ldp);
      });
    });
  });
});
