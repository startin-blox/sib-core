export declare global {
  interface Window {
    fetchTranslationPromise: Promise;
    cachePropsSearchFilter: {
      [key: string]: {
        setFields: string[] | null;
        setSearchFields: string[] | null;
      };
    };
  }
}
