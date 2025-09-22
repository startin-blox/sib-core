declare let sibStore: import('./libs/store/shared/types.ts').IStore;
import('./libs/store/cache/cache-manager.ts').CacheManagerInterface;

interface StoreOptions {
  fetchMethod?: Promise<any>;
  session?: Promise<any>;
  cacheManager?: CacheManagerInterface;
}
