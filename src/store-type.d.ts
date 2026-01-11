declare let sibStore: import('./libs/store/shared/types.ts').IStore;
import('./libs/store/cache/CacheManager.ts').CacheManagerInterface;

interface StoreOptions {
  fetchMethod?: (
    input: RequestInfo,
    init?: RequestInit | undefined,
  ) => Promise<Response>;
  session?: Promise<any>;
  cacheManager?: CacheManagerInterface;
}
