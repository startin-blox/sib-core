import type { IStore } from './libs/store/shared/types.ts';

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
  }
}
