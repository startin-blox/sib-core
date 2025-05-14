type StoreLib = typeof import('../../../src/store.ts');

describe('store twice', { testIsolation: false }, () => {
  it('should get the same store data from index.ts and store.ts', () => {
    cy.visit('/examples/e2e/store-loaded-twice.html');

    cy.window().then(async (win: any) => {
      expect(window.sibStore).to.be.undefined;
      expect(win.sibStore).to.be.undefined;
      const { store: storeFromCypress } = (await import(
        '../../../src/store.ts'
      )) as StoreLib;
      expect(window.sibStore).to.not.be.undefined;
      expect(win.sibStore).to.be.undefined;

      // import from store.js
      const { store, baseContext } = (await win.loadStore()) as StoreLib;
      expect(window.sibStore).to.not.be.undefined;
      expect(win.sibStore).to.not.be.undefined;
      expect(store).to.not.equals(storeFromCypress);
      expect(store).to.equals(win.sibStore);

      // import from index.js
      const { store: storeFromCore } =
        (await win.loadStoreFromCore()) as StoreLib;
      expect(storeFromCore).to.equals(store);
      expect(storeFromCore).to.equals(win.sibStore);

      expect(storeFromCypress.cache.length()).to.equals(0);
      expect(store.cache.length()).to.equals(0);
      expect(storeFromCore.cache.length()).to.equals(0);

      await store.getData('/examples/data/list/user-1.jsonld', baseContext);
      expect(storeFromCypress.cache.length()).to.equals(0);
      expect(store.cache.length()).to.equals(4);
      expect(storeFromCore.cache.length()).to.equals(4);
    });
  });
});
