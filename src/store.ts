// Import minimal polyfills first
import './polyfills.ts';

// Import semantizer to make SEMANTIZER available globally
import './libs/store/semantizer/semantizer.ts';

import { base_context as baseContext } from './libs/store/impl/ldp/LdpStore.ts';

import { StoreType } from './libs/store/shared/types.ts';
import { StoreService } from './libs/store/storeService.ts';

const sibStore = StoreService.getInstance();
if (!sibStore) throw new Error('Store is not available');

const semantizer = (globalThis as unknown as Record<string, unknown>)
  .SEMANTIZER;
export {
  semantizer as SEMANTIZER,
  StoreService,
  StoreType,
  baseContext,
  sibStore,
};
