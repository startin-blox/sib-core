import type * as JSONLDContextParser from 'jsonld-context-parser';
import type { CacheManagerInterface } from '../../shared/cache/cache-manager.ts';
import { InMemoryCacheManager } from '../../shared/cache/in-memory.ts';
import type { ServerPaginationOptions } from '../../shared/options/server-pagination.ts';
import type { ServerSearchOptions } from '../../shared/options/server-search.ts';
import type { IStore, StoreConfig } from '../../shared/types.ts';
<<<<<<<< HEAD:src/libs/store/impl/federated-catalogue/FederatedCatalogueStore.ts
import type { Resource } from '../../shared/types.ts';
import { mapSourceToDestination } from '../../shared/utils.ts';
========
import type { Container, Resource } from '../../shared/types.ts';
import {
  initLocalDataSourceContainer,
  mapSourceToDestination,
} from '../../shared/utils.ts';
>>>>>>>> 242496e2 (refactor: store folder structure):src/libs/store/implemenations/federated-catalogue/FederatedCatalogueStore.ts
import { getFederatedCatalogueAPIWrapper } from './FederatedCatalogueAPIWrapper-instance.ts';
import type { FederatedCatalogueAPIWrapper } from './FederatedCatalogueAPIWrapper.ts';
import type { Source } from './interfaces.ts';

export class FederatedCatalogueStore implements IStore<any> {
  cache: CacheManagerInterface;
  session: Promise<any> | undefined;
  private fcApi: FederatedCatalogueAPIWrapper;

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
    this.cache = new InMemoryCacheManager();
  }

  async getData(args: any) {
    const targetType = 'targetType' in args ? args.targetType : args.id;

    // Mock implementation of getData
    // First case, we return a list of self-descriptions, each of them having a hash
    if (!this.fcApi) {
      throw new Error('Federated API not initialized, returning empty data.');
    }

    let resource = await this.get(targetType);

    if (!resource || resource['ldp:contains'].length === 0) {
      resource = await this.initLocalDataSourceContainer(targetType);
      const dataset = await this.fcApi.getAllSelfDescriptions();
      for (const item in dataset.items) {
        const sd: Source = await this.fcApi.getSelfDescriptionByHash(
          dataset.items[item].meta.sdHash,
        );
        if (sd) {
          const mappedResource = mapSourceToDestination(sd, {
            temsServiceBase: this.cfg.temsServiceBase as string,
            temsCategoryBase: this.cfg.temsCategoryBase as string,
            temsImageBase: this.cfg.temsImageBase as string,
            temsProviderBase: this.cfg.temsProviderBase as string,
          });

          resource['ldp:contains'].push(mappedResource);
        }
      }
      this.setLocalData(resource, targetType);
    }

    document.dispatchEvent(
      new CustomEvent('save', {
        detail: { resource: { '@id': resource['@id'] } },
        bubbles: true,
      }),
    );

    return resource;
  }

  /**
   * Initializes a local data source container with a deterministic ID.
   * This function creates a new local data source container with a predictable identifier
   * based on the endpoint configuration and sets it in the local store.
   * @param containerType Optional container type for different data categories
   * @returns A local data source container with a deterministic ID.
   */
  async initLocalDataSourceContainer(dataSrc = '', containerType = 'default') {
    const endpointHash =
      this.cfg.endpoint?.replace(/[^a-zA-Z0-9]/g, '') || 'unknown';
    const idField = `fc-${endpointHash}-${containerType}`;

    if (!dataSrc) {
      dataSrc = `store://local.${idField}/`;
    }
    const localContainer: Resource = {
      '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
      '@type': 'ldp:Container',
      '@id': dataSrc,
      'ldp:contains': new Array<any>(),
      permissions: ['view'],
    };
    await this.setLocalData(localContainer, dataSrc);
    return localContainer;
  }

  async get(
    id: string,
    _serverPagination?: ServerPaginationOptions,
    _serverSearch?: ServerSearchOptions,
  ): Promise<Resource | null> {
    try {
      const resource = await this.cache.get(id);
      return resource || null;
    } catch (error) {
      console.error(
        `[FederatedCatalogueStore] Error getting resource ${id}:`,
        error,
      );
      return null;
    }
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

  async clearCache(id: string) {
    try {
      if (await this.cache.has(id)) {
        await this.cache.delete(id);
        console.log(`[FederatedCatalogueStore] Cleared cache for ${id}`);
      }
    } catch (error) {
      console.error(
        `[FederatedCatalogueStore] Error clearing cache for ${id}:`,
        error,
      );
    }
  }

  async cacheResource(key: string, resourceProxy: any) {
    try {
      await this.cache.set(key, resourceProxy);
      console.log(`[FederatedCatalogueStore] Cached resource ${key}`);
    } catch (error) {
      console.error(
        `[FederatedCatalogueStore] Error caching resource ${key}:`,
        error,
      );
    }
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

  async setLocalData(
    resource: object,
    id: string,
    _skipFetch?: boolean,
  ): Promise<string | null> {
    try {
      const resourceWithId = {
        ...resource,
        '@id': id,
      };
      await this.cache.set(id, resourceWithId);
      console.log(`[FederatedCatalogueStore] Stored local data for ${id}`);
      this.notifyComponents(id, resourceWithId); //??
      return id;
    } catch (error) {
      console.error(
        `[FederatedCatalogueStore] Error storing local data for ${id}:`,
        error,
      );
      return null;
    }
  }

  notifyComponents(id: string, resource: Resource) {
    document.dispatchEvent(
      new CustomEvent('resoureReady', {
        detail: {
          id,
          resource,
          fetchedResource: resource,
        },
        bubbles: true,
      }),
    );
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
