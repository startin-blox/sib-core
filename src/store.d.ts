declare let sibStore: import('./libs/store/store').Store;

interface StoreOptions {
  fetchMethod?: Promise<any>;
  session?: Promise<any>;
}
