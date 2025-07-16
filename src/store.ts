import {
  base_context as baseContext,
  getStoreAsync,
  getStore,
} from './libs/store/store.ts';

const sibStore = await getStoreAsync();
if (!sibStore) throw new Error('Store is not available');

export {
  sibStore,
  baseContext,
  getStore,
  getStoreAsync,
};
