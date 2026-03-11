// Import minimal polyfills first
import './polyfills.ts';

// Import semantizer to make SEMANTIZER available globally
import './libs/store/semantizer/semantizer.ts';

import { base_context as baseContext } from './libs/store/impl/ldp/LdpStore.ts';

import {
  StoreType,
  hasQueryIndex,
  hasQueryIndexConjunction,
  hasSetLocalData,
} from './libs/store/shared/types.ts';
import type {
  ConjunctionQueryOptions,
  Container,
  GetDataArgs,
  IStore,
  LimitedResource,
  Resource,
  StoreConfig,
  StoreInstance,
} from './libs/store/shared/types.ts';
import { StoreService } from './libs/store/storeService.ts';

const sibStore = StoreService.getInstance();
if (!sibStore) throw new Error('Store is not available');

const semantizer = (globalThis as unknown as Record<string, unknown>)
  .SEMANTIZER;

// Expose store utilities globally via window.sib namespace
if (!window.sib) {
  window.sib = {} as typeof window.sib;
}

window.sib.store = sibStore;
window.sib.storeService = StoreService;
window.sib.storeType = StoreType;
window.sib.hasQueryIndex = hasQueryIndex;
window.sib.hasSetLocalData = hasSetLocalData;
window.sib.hasQueryIndexConjunction = hasQueryIndexConjunction;

// Keep backward compatibility
if (!window.sibStore) {
  window.sibStore = sibStore;
}

export {
  semantizer as SEMANTIZER,
  StoreService,
  StoreType,
  baseContext,
  sibStore,
  // Type guards (runtime)
  hasQueryIndex,
  hasQueryIndexConjunction,
  hasSetLocalData,
};

// Types & interfaces (compile-time only, for TypeScript consumers)
export type {
  ConjunctionQueryOptions,
  Container,
  GetDataArgs,
  IStore,
  LimitedResource,
  Resource,
  StoreConfig,
  StoreInstance,
};
