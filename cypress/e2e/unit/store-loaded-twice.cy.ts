type StoreLib = typeof import('../../../src/store.ts');

type CustomWin = {
  loadStore(): Promise<StoreLib>;
  loadStoreFromCore(): Promise<StoreLib>;
};

describe('store twice', { testIsolation: false }, () => {
  it('should get the same store data from index.ts and store.ts', () => {
    cy.visit('/examples/e2e/store-loaded-twice.html');

    //@ts-ignore
    cy.window().then(async (win: Cypress.AUTWindow & CustomWin) => {
      expect(win.sibStore).to.be.undefined;

      // import from store.js
      const { store, baseContext } = await win.loadStore();

      expect(win.sibStore).to.not.be.undefined;
      expect(store).to.equals(win.sibStore);

      // import from index.js
      const { store: storeCore } = await win.loadStoreFromCore();
      expect(storeCore).to.equals(store);
      expect(storeCore).to.equals(win.sibStore);

      expect(store.cache.length()).to.equals(0);
      expect(storeCore.cache.length()).to.equals(0);
      expect(win.sibStore.cache.length()).to.equals(0);

      await store.getData('/examples/data/list/user-1.jsonld', baseContext);

      expect(store.cache.length()).to.equals(4);
      expect(storeCore.cache.length()).to.equals(4);
      expect(win.sibStore.cache.length()).to.equals(4);
    });
  });
});
