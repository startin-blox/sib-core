declare var PubSub: any;
declare var markdownit: any;
declare var fetchTranslationPromise: Promise;
declare var cachePropsSearchFilter: {
  [key: string]: {
    setFields: string[] | null;
    setSearchFields: string[] | null;
  };
};
