import { base_context as baseContext } from './libs/store/LdpStore.ts';

import { StoreService } from './libs/store/storeService.ts';

const sibStore = StoreService.getInstance();
if (!sibStore) throw new Error('Store is not available');

export { StoreService, baseContext, sibStore };
