declare let sibStore: import('./libs/store/store').Store;
import('./libs/store/cache/cache-manager').CacheManagerInterface;

interface StoreOptions {
  fetchMethod?: Promise<any>;
  session?: Promise<any>;
  cacheManager?: CacheManagerInterface;
}
