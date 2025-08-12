import type * as JSONLDContextParser from 'jsonld-context-parser';
import type { Resource } from '../../mixins/interfaces.ts';
import type { CacheManagerInterface } from './cache/cache-manager.ts';
import type {
  KeycloakOptionsLogins,
  KeycloakOptionsServer,
} from './federated-catalogue/FederatedCatalogueAPIWrapper.ts';
import type { Container } from './federated-catalogue/interfaces.ts';
import type { ServerPaginationOptions } from './options/server-pagination.ts';
import type { ServerSearchOptions } from './options/server-search.ts';

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

  getData(...GetDataArgs): Promise<Resource | null> | Promise<Container<T>>;
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
