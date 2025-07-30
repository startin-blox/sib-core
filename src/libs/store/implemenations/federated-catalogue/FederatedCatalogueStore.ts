import type * as JSONLDContextParser from 'jsonld-context-parser';
import type { CacheManagerInterface } from '../../shared/cache/cache-manager.ts';
import { InMemoryCacheManager } from '../../shared/cache/in-memory.ts';
import type { ServerPaginationOptions } from '../../shared/options/server-pagination.ts';
import type { ServerSearchOptions } from '../../shared/options/server-search.ts';
import type { IStore, StoreConfig } from '../../shared/types.ts';
import type { Container, Resource } from '../../shared/types.ts';
import {
  initLocalDataSourceContainer,
  mapSourceToDestination,
} from '../../shared/utils.ts';
import { getFederatedCatalogueAPIWrapper } from './FederatedCatalogueAPIWrapper-instance.ts';
import type { FederatedCatalogueAPIWrapper } from './FederatedCatalogueAPIWrapper.ts';
import type { Source } from './interfaces.ts';

export class FederatedCatalogueStore implements IStore<any> {
  cache: CacheManagerInterface;
  session: Promise<any> | undefined;
  private fcApi: FederatedCatalogueAPIWrapper;
  private fcContainer: Container<any> | undefined;

  constructor(private cfg: StoreConfig) {
    if (!this.cfg.login) {
      throw new Error('Login must be provided for FederatedCatalogueStore');
    }

    if (!this.cfg.endpoint) {
      throw new Error(
        'Missing required `endpoint` in StoreConfig for FederatedCatalogueStore',
      );
    }
    if (!this.cfg.optionsServer) {
      throw new Error(
        'Missing required `optionsServer` in StoreConfig for FederatedCatalogueStore',
      );
    }

    this.fcApi = getFederatedCatalogueAPIWrapper(
      this.cfg.endpoint,
      this.cfg.login,
      this.cfg.optionsServer,
    );
    this.fcContainer = undefined;
    this.cache = new InMemoryCacheManager();
  }

  async getData(args: any) {
    const targetType = 'targetType' in args ? args.targetType : args.id;

    // Mock implementation of getData
    // First case, we return a list of self-descriptions, each of them having a hash
    if (!this.fcApi) {
      throw new Error('Federated API not initialized, returning empty data.');
    }

    if (!this.fcContainer || this.fcContainer['ldp:contains'].length === 0) {
      this.fcContainer = await initLocalDataSourceContainer();
      const dataset = await this.fcApi.getAllSelfDescriptions();
      for (const item in dataset.items) {
        const sd: Source = await this.fcApi.getSelfDescriptionByHash(
          dataset.items[item].meta.sdHash,
        );
        if (sd) {
          const resource = mapSourceToDestination(sd, {
            temsServiceBase: this.cfg.temsServiceBase as string,
            temsCategoryBase: this.cfg.temsCategoryBase as string,
            temsImageBase: this.cfg.temsImageBase as string,
            temsProviderBase: this.cfg.temsProviderBase as string,
          });

          // Check if the resource is already in the local container
          if (
            !this.fcContainer['ldp:contains'].some(
              (r: Resource) => r['@id'] === resource['@id'],
            )
          ) {
            this.fcContainer['ldp:contains'].push(resource);
          }
        }
      }
      // TODO: Rewrite this line to keep different types of tore isolated
      // window.sibStore.setLocalData(this.fcContainer, this.fcContainer['@id']);
    }

    const localContainer = await initLocalDataSourceContainer();
    localContainer['ldp:contains'] = this.fcContainer['ldp:contains'].filter(
      (item: Resource) => item['@type'] === targetType,
    );
    document.dispatchEvent(
      new CustomEvent('save', {
        detail: { resource: { '@id': this.fcContainer['@id'] } },
        bubbles: true,
      }),
    );

    return localContainer;
  }

  get(
    _id: string,
    _serverPagination?: ServerPaginationOptions,
    _serverSearch?: ServerSearchOptions,
  ) {
    return Promise.resolve(null);
  }
  post(_resource: object, _id: string, _skipFetch?: boolean) {
    return Promise.resolve(null);
  }

  put(_resource: object, _id: string, _skipFetch?: boolean) {
    return Promise.resolve(null);
  }

  patch(_resource: object, _id: string, _skipFetch?: boolean) {
    return Promise.resolve(null);
  }

  delete(
    _id: string,
    _context?: JSONLDContextParser.JsonLdContextNormalized | null,
  ) {
    return Promise.resolve(null);
  }

  clearCache(_id: string) {
    return Promise.resolve();
  }
  cacheResource(_key: string, _resourceProxy: any) {
    return Promise.resolve();
  }
  _getLanguage() {
    return '';
  }
  selectLanguage(_selectedLanguageCode: string) {}

  getExpandedPredicate(
    _property: string,
    _context: JSONLDContextParser.JsonLdContextNormalized | null,
  ) {
    return null;
  }
  subscribeResourceTo(_resourceId: string, _nestedResourceId: string) {}
  fetchAuthn(_iri: string, _options: any) {
    return Promise.resolve({} as Response);
  }
}

export class FederatedCatalogueStoreAdapter {
  private static store: IStore<any>;

  private constructor() {}

  private static validateConfiguration(cfg: StoreConfig): void {
    const requiredFields = [
      'temsServiceBase',
      'temsCategoryBase',
      'temsImageBase',
      'temsProviderBase',
    ] as const;

    const missingFields = requiredFields.filter(field => !cfg[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `[FederatedCatalogueStoreAdapter] Missing required configuration fields: ${missingFields.join(', ')}`,
      );
    }
  }

  public static getStoreInstance(cfg?: StoreConfig): IStore<any> {
    if (!FederatedCatalogueStoreAdapter.store) {
      if (!cfg) {
        throw new Error(
          '[FederatedCatalogueStoreAdapter] configuration is required',
        );
      }

      FederatedCatalogueStoreAdapter.validateConfiguration(cfg);
      FederatedCatalogueStoreAdapter.store = new FederatedCatalogueStore(cfg);
    }
    return FederatedCatalogueStoreAdapter.store;
  }
}
