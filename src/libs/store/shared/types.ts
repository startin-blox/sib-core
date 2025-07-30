import type * as JSONLDContextParser from 'jsonld-context-parser';
import type { IndexQueryOptions } from '../implemenations/ldp/LdpStore.ts';
import type {
  KeycloakOptionsLogins,
  KeycloakOptionsServer,
} from '../impl/federated-catalogue/FederatedCatalogueAPIWrapper.ts';
import type { CacheManagerInterface } from './cache/cache-manager.ts';
import type { ServerPaginationOptions } from './options/server-pagination.ts';
import type { ServerSearchOptions } from './options/server-search.ts';

// Add the missing ConjunctionQueryOptions interface
export interface ConjunctionQueryOptions {
  dataSrcIndex: string;
  dataRdfType: string;
  filterValues: Record<string, any>;
  useConjunction: boolean;
  exactMatchMapping?: Record<string, boolean>;
}

type Permission = 'add' | 'delete' | 'change' | 'control' | 'view' | string;
type Context = Record<string, string | { '@id': string }>;
type DateTime = string;
export interface Resource extends LimitedResource {
  [key: string]: any;
}

export interface LimitedResource {
  '@id': string;
  '@type'?: string | string[] | Promise<string | string[]>;
  _originalResource?: Resource;
  properties?: string[] | Promise<string[]>;
  permissions?: Permission[];
  clientContext?: Context | Promise<Context>;
  serverContext?: Context | Promise<Context>;
  creation_date?: DateTime;
  update_date?: DateTime;
}

// export interface ResourceLdp extends LimitedResource {
//   isContainer: Function;
//   getContainerList: Function;
//   getResourceData: Function;
//   isArray: Function;
//   isFullResource: Function;
//   serverPagination: object;
//   merge: Function;
// }

export interface Container<T> extends Resource {
  'ldp:contains': T[];
}

type ListArgs = { targetType: string };
type FetchArgs = {
  id: string;
  context: object | [];
  parentId: string;
  localData?: object;
  forceFetch?: boolean;
  serverPagination?: ServerPaginationOptions;
  serverSearch?: ServerSearchOptions;
  headers?: object;
  bypassLoadingList?: boolean;
};

export type GetDataArgs = ListArgs | FetchArgs;

// TODO: T might be Resource / Container
export interface IStore<T> {
  cache: CacheManagerInterface;
  session: Promise<any> | undefined;
  headers?: object;

  getData(
    ...GetDataArgs
  ):
    | Promise<Resource | null>
    | Promise<Container<T>>
  get(
    id: string,
    serverPagination?: ServerPaginationOptions,
    serverSearch?: ServerSearchOptions,
  ): Promise<Resource | null>;
  post(
    resource: object,
    id: string,
    skipFetch?: boolean,
  ): Promise<string | null>;

  put(
    resource: object,
    id: string,
    skipFetch?: boolean,
  ): Promise<string | null>;

  patch(
    resource: object,
    id: string,
    skipFetch?: boolean,
  ): Promise<string | null>;

  delete(
    id: string,
    context?: JSONLDContextParser.JsonLdContextNormalized | null,
  ): Promise<any>;
  fetchAuthn(iri: string, options: any): Promise<Response>;

  clearCache(id: string): Promise<void>;
  cacheResource(key: string, resourceProxy: any): Promise<void>;
  _getLanguage(): string;
  selectLanguage(selectedLanguageCode: string): void;

  subscribeResourceTo(resourceId: string, nestedResourceId: string): void;
  getExpandedPredicate(
    property: string,
    context: JSONLDContextParser.JsonLdContextNormalized | null,
  ): string | null;

  // Optional methods that some stores implement
  queryIndex?(options: IndexQueryOptions): Promise<any[]>;
  setLocalData?(
    data: object,
    id: string,
    skipFetch?: boolean,
    bypassLoadingList?: boolean,
  ): Promise<string | null>;
  queryIndexConjunction?(options: ConjunctionQueryOptions): Promise<any[]>;
}

// Type guard functions
export function hasQueryIndex(
  store: IStore<any>,
): store is IStore<any> & { queryIndex: Function } {
  return 'queryIndex' in store && typeof store.queryIndex === 'function';
}

export function hasSetLocalData(
  store: IStore<any>,
): store is IStore<any> & { setLocalData: Function } {
  return 'setLocalData' in store && typeof store.setLocalData === 'function';
}

export function hasQueryIndexConjunction(
  store: IStore<any>,
): store is IStore<any> & { queryIndexConjunction: Function } {
  return (
    'queryIndexConjunction' in store &&
    typeof store.queryIndexConjunction === 'function'
  );
}

export enum StoreType {
  LDP = 'ldp',
  FederatedCatalogue = 'federatedCatalogue',
}

export interface StoreOptions {
  fetchMethod?: Promise<any>;
  session?: Promise<any>;
  cacheManager?: CacheManagerInterface;
}

export type StoreConfig = {
  type: StoreType;
  endpoint?: string;
  login?: KeycloakOptionsLogins;
  temsServiceBase?: string;
  temsCategoryBase?: string;
  temsImageBase?: string;
  temsProviderBase?: string;
  options?: StoreOptions;
  optionsServer?: KeycloakOptionsServer;
};
