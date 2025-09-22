import type * as JSONLDContextParser from 'jsonld-context-parser';
import type { CacheManagerInterface } from '../../cache/cache-manager.ts';
import { InMemoryCacheManager } from '../../cache/in-memory.ts';
import type { ServerPaginationOptions } from '../../shared/options/server-pagination.ts';
import type { ServerSearchOptions } from '../../shared/options/server-search.ts';
import type { IStore, StoreConfig } from '../../shared/types.ts';
import type { Resource } from '../../shared/types.ts';
import { getFederatedCatalogueAPIWrapper } from './FederatedCatalogueAPIWrapper-instance.ts';
import type { FederatedCatalogueAPIWrapper } from './FederatedCatalogueAPIWrapper.ts';
import type { DcatService, Destination, Source } from './interfaces.ts';

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
          const mappedResource = this.mapSourceToDestination(sd, {
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

  /**
   * 2. Revised mapping function:
   *    - If “dcat:service” exists, map from that directly.
   *    - Otherwise, if “dcat:dataset” exists, treat its first array element as the service block.
   *    - Use gax-core:operatedBy when dcat:service is present, and gax-core:offeredBy when dcat:dataset is used.
   */
  private mapSourceToDestination(
    src: Source,
    opts: {
      temsServiceBase: string; // e.g. "https://api.tems-stg.startinblox.com/services/"
      temsCategoryBase: string; // e.g. "https://api.tems-stg.startinblox.com/providers/categories/"
      temsImageBase: string; // e.g. "https://api.tems-stg.startinblox.com/objects/images/"
      temsProviderBase: string; // e.g. "https://api.tems-stg.startinblox.com/providers/"
    },
  ): Destination {
    const vc = src.verifiableCredential;
    const cs = vc.credentialSubject;

    // 1) Determine which key holds the service block
    let catInfo: DcatService;
    let usedKey: 'service' | 'dataset';
    let type: 'tems:Service' | 'tems:DataOffer';
    if (cs['dcat:service']) {
      catInfo = cs['dcat:service'];
      usedKey = 'service';
      type = 'tems:Service';
    } else if (cs['dcat:dataset'] && cs['dcat:dataset'].length > 0) {
      catInfo = cs['dcat:dataset'][0];
      usedKey = 'dataset';
      type = 'tems:DataOffer';
    } else {
      throw new Error(
        "Expected either credentialSubject['dcat:service'] or a non-empty array in ['dcat:dataset']",
      );
    }

    // 2) Build TEMS‐style @id from the Resource’s @id
    const resourceId = cs['@id'];
    const slug = resourceId.split('/').pop() || 'unknown';
    const serviceId = `${opts.temsServiceBase}${encodeURIComponent(slug)}/`;

    // 3) Map issuanceDate → creation_date; expirationDate → update_date
    const creation_date = vc.issuanceDate;
    const update_date = vc.expirationDate;

    // 4) Map dcterms:title + rdfs:comment → name + description
    const name = catInfo['dcterms:title'];
    const description = catInfo['rdfs:comment'];

    // 5) long_description ← join dcat:keyword into a single string
    const keywords = catInfo['dcat:keyword'] || [];
    const long_description =
      keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : '';

    // 6) Build categories container from keywords
    const categories = {
      '@id': `${serviceId}categories/`,
      '@type': 'ldp:Container' as const,
      'ldp:contains': keywords.map(kw => ({
        '@id': `${opts.temsCategoryBase}${encodeURIComponent(kw)}/`,
        '@type': 'tems:Category' as const,
        name: kw,
      })),
    };

    // 7) Determine activation_status / is_in_app / is_external / is_api
    const endpointURL = catInfo['dcat:endpointURL'] || '';
    const hasEndpoint = endpointURL.trim().length > 0;
    const activation_status = hasEndpoint;
    const is_in_app = hasEndpoint;
    const is_external = hasEndpoint;
    const is_api = hasEndpoint;

    // 8) Collect thumbnail URLs “as-is”
    const imageUrls: string[] = [];
    if (catInfo['foaf:thumbnail']?.['rdf:resource']) {
      imageUrls.push(catInfo['foaf:thumbnail']['rdf:resource']);
    }
    if (catInfo['dcterms:creator']?.['foaf:thumbnail']?.['rdf:resource']) {
      imageUrls.push(
        catInfo['dcterms:creator']['foaf:thumbnail']['rdf:resource'],
      );
    }
    const images = {
      '@id': `${serviceId}images/`,
      '@type': 'ldp:Container' as const,
      'ldp:contains': imageUrls.map(url => ({
        // Keep the URL exactly as-is
        '@id': `${opts.temsImageBase}${encodeURIComponent(
          url.split('/').pop() || '0',
        )}/`,
        url: url,
        iframe: false, // Assuming no iframes in this case
        name: url.split('/').pop() || 'image',
        '@type': 'tems:Image' as const,
      })),
    };

    // 9) contact_url ← dcat:endpointDescription; documentation_url ← same or “-”
    const contact_url = catInfo['dcat:endpointDescription'] || '';
    const documentation_url = contact_url || '';
    let service_url = catInfo['dcat:endpointURL'] || '';
    if (service_url.includes('demo.isan.org'))
      // Then cut the string at demo.isan.org
      service_url = new URL(service_url).origin;

    // 10) Map provider:
    //     - If we used “dcat:service”, pick gax-core:operatedBy
    //     - If we used “dcat:dataset”, pick gax-core:offeredBy
    let providerRef: string;
    if (usedKey === 'service') {
      providerRef = cs['gax-core:operatedBy']?.['@id'] || '';
    } else {
      providerRef = cs['gax-core:offeredBy']?.['@id'] || '';
    }
    const providerSlug =
      providerRef.split(':').pop() + String(Math.random()) || '0';
    const providerLogo =
      catInfo['dcterms:creator']?.['foaf:thumbnail']?.['rdf:resource'] || '';
    const provider = {
      '@id': `${opts.temsProviderBase}${encodeURIComponent(providerSlug)}/`,
      '@type': 'tems:Provider',
      name: catInfo['dcterms:creator']?.['foaf:name'] || '',
      image: {
        '@id': `${opts.temsImageBase}${encodeURIComponent(
          providerLogo.split('/').pop() || '0',
        )}/`,
        '@type': 'tems:Image',
        iframe: false, // Assuming no iframes in this case
        url: providerLogo,
        name: providerLogo.split('/').pop() || 'provider-logo',
      },
    };

    // 11) data_offers: leave empty for now
    const data_offers: any[] = [];

    // 12) Assemble the Destination object
    const dest: Destination = {
      '@id': serviceId,
      creation_date,
      update_date,
      name,
      description,
      long_description,
      categories,
      activation_status,
      activation_date: null,
      licence: null,
      is_in_app,
      is_external,
      is_api,
      images,
      release_date: null,
      last_update: null,
      developper: null,
      contact_url,
      documentation_url,
      url: service_url,
      provider,
      data_offers,
      '@type': type,
    };

    return dest;
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
