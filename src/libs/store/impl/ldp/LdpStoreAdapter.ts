import type { IStore, StoreConfig } from '../../shared/types.ts';
import { LdpStore } from './LdpStore.ts';

export function initLdpStore(_cfg?: StoreConfig): LdpStore {
  if (window.sibStore) {
    return window.sibStore;
  }

  const storeOptions: StoreOptions = {};
  const sibAuth = document.querySelector('sib-auth') as any;
  if (sibAuth) {
    const sibAuthDefined = customElements.whenDefined(sibAuth.localName);
    storeOptions.session = sibAuthDefined.then(() => sibAuth.session);
    storeOptions.fetchMethod = sibAuthDefined.then(() => sibAuth.getFetch());
  }

  const store = new LdpStore({ ..._cfg?.options, ...storeOptions });
  window.sibStore = store;
  return store;
}

export class LdpStoreAdapter {
  private static store: IStore<any>;

  private constructor() {}

  public static getStoreInstance(_cfg?: StoreConfig): IStore<any> {
    if (!LdpStoreAdapter.store) {
      LdpStoreAdapter.store = initLdpStore(_cfg);
    }
    return LdpStoreAdapter.store;
  }
}
