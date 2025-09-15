import type { IStore, StoreConfig } from '../../shared/types.ts';
import { LdpStore } from './LdpStore.ts';

export function initLdpStore(_cfg?: StoreConfig): LdpStore {
  if (window.sibStore) {
    return window.sibStore;
  }

  const store = new LdpStore(_cfg?.options || {});
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
