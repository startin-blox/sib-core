// Import minimal polyfills first
import './polyfills.ts';

// Import semantizer to make SEMANTIZER available globally
import './libs/store/semantizer/semantizer.ts';

import { base_context as baseContext } from './libs/store/impl/ldp/LdpStore.ts';

import { StoreType } from './libs/store/shared/types.ts';
import { StoreService } from './libs/store/storeService.ts';

declare global {
  var sibStoreService: typeof StoreService;
  var sibStoreType: typeof StoreType;
}

const sibStore = StoreService.getInstance();
if (!sibStore) throw new Error('Store is not available');

const semantizer = (globalThis as unknown as Record<string, unknown>)
  .SEMANTIZER;

// Expose store utilities globally for browser access
if (!window.sibStore) {
  window.sibStore = sibStore;
}

if (typeof globalThis.sibStoreService === 'undefined') {
  Object.defineProperty(globalThis, 'sibStoreService', {
    value: StoreService,
    writable: false,
    configurable: true,
  });
}

if (typeof globalThis.sibStoreType === 'undefined') {
  Object.defineProperty(globalThis, 'sibStoreType', {
    value: StoreType,
    writable: false,
    configurable: true,
  });
}

export {
  semantizer as SEMANTIZER,
  StoreService,
  StoreType,
  baseContext,
  sibStore,
};
