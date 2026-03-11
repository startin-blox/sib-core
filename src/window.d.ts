import type {
  IStore,
  StoreConfig,
  StoreType,
} from './libs/store/shared/types.ts';
import type { StoreService } from './libs/store/storeService.ts';

export declare global {
  interface Window {
    fetchTranslationPromise: Promise<any>;
    cachePropsSearchFilter: {
      [key: string]: {
        setFields: string[] | null;
        setSearchFields: string[] | null;
      };
    };
    sibStore: IStore<any>;
    sib: {
      store: IStore<any>;
      storeService: typeof StoreService;
      storeType: typeof StoreType;
      hasQueryIndex: (store: IStore<any>) => boolean;
      hasSetLocalData: (store: IStore<any>) => boolean;
      hasQueryIndexConjunction: (store: IStore<any>) => boolean;
    };
  }
}
