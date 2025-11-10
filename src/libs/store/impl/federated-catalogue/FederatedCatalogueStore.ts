import type * as JSONLDContextParser from 'jsonld-context-parser';
import type { CacheManagerInterface } from '../../cache/CacheManager.ts';
import { InMemoryCacheManager } from '../../cache/InMemory.ts';
import {
  type CacheItemMetadata,
  LocalStorageCacheMetadataManager,
} from '../../cache/LocalStorageCacheMetadata.ts';
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
  private fcApi: FederatedCatalogueAPIWrapper | null;
  private metadataManager: LocalStorageCacheMetadataManager | null;
  private enableCaching: boolean;

  constructor(private cfg: StoreConfig) {
    if (!this.cfg.login) {
      throw new Error('Login must be provided for FederatedCatalogueStore');
    }

    if (!this.cfg.endpoint) {
      throw new Error(
        'Missing required `endpoint` in StoreConfig for FederatedCatalogueStore',
      );
    }

    try {
      this.fcApi = getFederatedCatalogueAPIWrapper(
        this.cfg.endpoint,
        this.cfg.login,
      );
    } catch (e) {
      console.error(
        '[FederatedCatalogueStore] Failed to initialize API wrapper:',
        e,
      );
      this.fcApi = null;
    }

    this.cache = new InMemoryCacheManager();

    // Initialize localStorage cache metadata if enabled
    this.enableCaching = this.cfg.enableLocalStorageMetadata === true;
    if (this.enableCaching && this.cfg.endpoint) {
      const cacheTTL = this.cfg.cacheTTL || 2 * 60 * 60 * 1000; // Default 2 hours
      this.metadataManager = new LocalStorageCacheMetadataManager(
        this.cfg.endpoint,
        cacheTTL,
      );

      // Check for page reload and clear cache if needed
      this.handlePageReload();
    } else {
      this.metadataManager = null;
    }
  }

  /**
   * Log cache statistics on initialization
   */
  private handlePageReload(): void {
    try {
      const stats = this.metadataManager?.getCacheStats();
      if (stats) {
      }
    } catch (error) {
      console.warn(
        '[FederatedCatalogueStore] Error reading cache stats:',
        error,
      );
    }
  }

  private resolveTargetType(args: any): string {
    if (typeof args === 'string') return args;
    if (typeof args === 'object' && args !== null) {
      return args.targetType ?? args.id ?? '';
    }
    return '';
  }

  async getData(args: any) {
    const targetType = this.resolveTargetType(args);

    if (!this.fcApi) {
      throw new Error('Federated API not initialized, returning empty data.');
    }

    // Check if we have cached data and metadata is valid
    const cacheIsValid =
      this.enableCaching && this.metadataManager?.isCacheValid();
    const hasCached = this.hasCachedData();

    if (cacheIsValid && hasCached) {
      return await this.getDeltaUpdatedData(targetType);
    }
    // Clear invalid cache if metadata exists but no resource data
    if (cacheIsValid && !hasCached && this.metadataManager) {
      this.metadataManager.clear();
    } else if (!cacheIsValid) {
    }
    return await this.getFullData(targetType);
  }

  /**
   * Check if we have actual cached data in localStorage
   */
  private hasCachedData(): boolean {
    try {
      if (!this.metadataManager) {
        return false;
      }

      const resource = this.metadataManager.getResource();
      const hasResourceData = !!(
        resource?.['ldp:contains'] && resource['ldp:contains'].length > 0
      );
      const metadataItemCount =
        this.metadataManager.getCacheStats().itemCount || 0;

      return hasResourceData && metadataItemCount > 0;
    } catch (error) {
      console.error(
        '[FederatedCatalogueStore] Error checking cached data:',
        error,
      );
      return false;
    }
  }

  /**
   * Perform delta update - only fetch changed items
   */
  private async getDeltaUpdatedData(targetType: string): Promise<Resource> {
    if (!this.fcApi || !this.metadataManager) {
      return await this.getFullData(targetType);
    }

    try {
      const apiList = await this.fcApi.getAllSelfDescriptions();

      if (!apiList || !apiList.items) {
        console.warn('[FederatedCatalogueStore] No items returned from API');
        return await this.getFullData(targetType);
      }

      // Get existing cached resource from localStorage
      const resource = this.metadataManager.getResource();
      if (!resource) {
        return await this.getFullData(targetType);
      }

      // Ensure resource has proper structure
      if (!resource['@id']) {
        resource['@id'] = targetType;
      }
      if (!resource['ldp:contains']) {
        resource['ldp:contains'] = [];
      }

      // Get known hashes from metadata
      const knownHashes = this.metadataManager.getKnownHashes();
      const apiHashes = new Set(apiList.items.map(item => item.meta.sdHash));

      // Compute delta
      const newHashes: string[] = [];
      const updatedHashes: string[] = [];
      const deletedHashes: string[] = [];

      // Find new and updated items
      for (const item of apiList.items) {
        const hash = item.meta.sdHash;
        if (!knownHashes.has(hash)) {
          // New item
          newHashes.push(hash);
        } else {
          // Check if updated
          const cachedMeta = this.metadataManager.getItemMetadata(hash);
          if (cachedMeta) {
            if (
              item.meta.uploadDatetime > cachedMeta.uploadDatetime ||
              item.meta.statusDatetime > cachedMeta.statusDatetime
            ) {
              updatedHashes.push(hash);
            }
          }
        }
      }

      // Find deleted items
      for (const hash of knownHashes) {
        if (!apiHashes.has(hash)) {
          deletedHashes.push(hash);
        }
      }

      // Fetch new and updated items
      const toFetch = [...newHashes, ...updatedHashes];
      const newMetadata: CacheItemMetadata[] = [];

      if (toFetch.length > 0) {
        for (const hash of toFetch) {
          try {
            const sd: Source | null =
              await this.fcApi.getSelfDescriptionByHash(hash);
            if (sd) {
              const mappedResource = this.mapSourceToDestination(sd, {
                temsServiceBase: this.cfg.temsServiceBase as string,
                temsCategoryBase: this.cfg.temsCategoryBase as string,
                temsImageBase: this.cfg.temsImageBase as string,
                temsProviderBase: this.cfg.temsProviderBase as string,
              });

              // Find and remove old version if updated
              if (updatedHashes.includes(hash)) {
                const index = resource['ldp:contains'].findIndex(
                  (r: any) => r['@id'] === mappedResource['@id'],
                );
                if (index !== -1) {
                  resource['ldp:contains'].splice(index, 1);
                }
              }

              // Add new/updated item
              resource['ldp:contains'].push(mappedResource);

              // Track metadata
              const apiItem = apiList.items.find(i => i.meta.sdHash === hash);
              if (apiItem) {
                newMetadata.push({
                  sdHash: hash,
                  uploadDatetime: apiItem.meta.uploadDatetime,
                  statusDatetime: apiItem.meta.statusDatetime,
                  cachedAt: Date.now(),
                  resourceId: mappedResource['@id'],
                });
              }
            }
          } catch (error) {
            console.error(
              `[FederatedCatalogueStore] Error fetching hash ${hash}:`,
              error,
            );
          }
        }
      }

      // Remove deleted items from metadata
      if (deletedHashes.length > 0) {
        // Note: We keep items in resource for safety (conservative approach)
        // In production, you might want to implement actual removal using hash-to-id mapping
        this.metadataManager.removeItems(deletedHashes);
      }

      // Update localStorage cache with resource and metadata
      if (newMetadata.length > 0) {
        this.metadataManager.updateCache(resource, newMetadata);
      }

      document.dispatchEvent(
        new CustomEvent('save', {
          detail: { resource: { '@id': resource?.['@id'] } },
          bubbles: true,
        }),
      );

      return resource;
    } catch (error) {
      console.error(
        '[FederatedCatalogueStore] Delta update failed, falling back to full fetch:',
        error,
      );
      return await this.getFullData(targetType);
    }
  }

  /**
   * Perform full fetch - get all items (original behavior)
   */
  private async getFullData(targetType: string): Promise<Resource> {
    if (!this.fcApi) {
      throw new Error('Federated API not initialized');
    }

    const resource = await this.initLocalDataSourceContainer(targetType);
    const dataset = await this.fcApi.getAllSelfDescriptions();

    const newMetadata: CacheItemMetadata[] = [];

    if (dataset) {
      for (const item of dataset.items) {
        const sd: Source | null = await this.fcApi.getSelfDescriptionByHash(
          item.meta.sdHash,
        );
        if (sd) {
          try {
            const mappedResource = this.mapSourceToDestination(sd, {
              temsServiceBase: this.cfg.temsServiceBase as string,
              temsCategoryBase: this.cfg.temsCategoryBase as string,
              temsImageBase: this.cfg.temsImageBase as string,
              temsProviderBase: this.cfg.temsProviderBase as string,
            });
            resource['ldp:contains'].push(mappedResource);

            // Track metadata if caching is enabled
            if (this.enableCaching) {
              newMetadata.push({
                sdHash: item.meta.sdHash,
                uploadDatetime: item.meta.uploadDatetime,
                statusDatetime: item.meta.statusDatetime,
                cachedAt: Date.now(),
                resourceId: mappedResource['@id'],
              });
            }
          } catch (error) {
            console.error(
              '[FederatedCatalogueStore] Error mapping resource:',
              error,
            );
          }
        }
      }
    }

    // Update localStorage cache if caching is enabled
    if (this.enableCaching && this.metadataManager && newMetadata.length > 0) {
      this.metadataManager.updateCache(resource, newMetadata);
    }

    document.dispatchEvent(
      new CustomEvent('save', {
        detail: { resource: { '@id': resource?.['@id'] } },
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

  async setLocalData(resource: object, id: string): Promise<string | null> {
    try {
      const resourceWithId = {
        ...resource,
        '@id': id,
      };
      await this.cache.set(id, resourceWithId);
      this.notifyComponents(id, resourceWithId);
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
   * Helper function to strip URN prefixes from strings
   */
  private stripUrnPrefix(id: string, prefix: string): string {
    if (id?.startsWith(prefix)) {
      return id.substring(prefix.length);
    }
    return id;
  }

  /**
   * Helper function to recursively strip urn:tems: prefix from all @id properties in an object
   */
  private stripTemsUrnFromPolicy(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.stripUrnPrefix(obj, 'urn:tems:');
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.stripTemsUrnFromPolicy(item));
    }

    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (key === '@id') {
            // Strip urn:tems: prefix from @id properties
            result[key] = this.stripUrnPrefix(obj[key], 'urn:tems:');
          } else {
            // Recursively process nested objects
            result[key] = this.stripTemsUrnFromPolicy(obj[key]);
          }
        }
      }
      return result;
    }

    return obj;
  }

  /**
   * 2. Revised mapping function:
   *    - If "dcat:service" exists at credentialSubject level, map from that directly.
   *    - If "dcat:dataset" exists, check if it contains a nested "dcat:service":
   *      - If yes, extract information from the nested dcat:service and treat as tems:Service
   *      - If no, treat the dataset itself as the source (tems:DataOffer)
   *    - Use gax-core:operatedBy when dcat:service is present, and gax-core:offeredBy when dcat:dataset is used.
   *    - Extract contract negotiation fields for Dataspace Protocol support.
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
    let usedKey: 'service' | 'dataset' | 'nested-service';
    let type: 'tems:Service' | 'tems:DataOffer';

    if (cs['dcat:service']) {
      // Case 1: Direct dcat:service at credentialSubject level
      catInfo = cs['dcat:service'];
      usedKey = 'service';
      type = 'tems:Service';
    } else if (cs['dcat:dataset'] && cs['dcat:dataset'].length > 0) {
      const dataset = cs['dcat:dataset'][0];

      if (dataset['dcat:service']) {
        // Case 2: Nested dcat:service within dcat:dataset
        // Extract information from the nested service
        catInfo = dataset['dcat:service'];
        usedKey = 'nested-service';
        type = 'tems:Service';
      } else {
        // Case 3: Direct dcat:dataset without nested service (original behavior)
        catInfo = dataset;
        usedKey = 'dataset';
        type = 'tems:DataOffer';
      }
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
    const name = catInfo['dcterms:title'] || catInfo['dct:title'];
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

    // 9) contact_url ← dcat:endpointDescription; documentation_url ← same or "-"
    const contact_url = catInfo['dcat:endpointDescription'] || '';
    const documentation_url = contact_url || '';
    let service_url = catInfo['dcat:endpointURL'] || '';

    // Log if service URL is missing from dcat:service
    if (!service_url) {
      console.warn(
        '[FederatedCatalogueStore] dcat:endpointURL is missing from dcat:service. Available fields:',
        Object.keys(catInfo),
      );
    }

    if (service_url.includes('demo.isan.org'))
      // Then cut the string at demo.isan.org
      service_url = new URL(service_url).origin;

    // 10) Map provider:
    //     - If we used "dcat:service", pick gax-core:operatedBy
    //     - If we used "nested-service", check operatedBy first, then offeredBy as fallback
    //     - If we used "dcat:dataset", pick gax-core:offeredBy
    let providerRef: string;
    if (usedKey === 'service') {
      providerRef = cs['gax-core:operatedBy']?.['@id'] || '';
    } else if (usedKey === 'nested-service') {
      // For nested service, prefer operatedBy but fallback to offeredBy
      providerRef =
        cs['gax-core:operatedBy']?.['@id'] ||
        cs['gax-core:offeredBy']?.['@id'] ||
        '';
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

    // 12) Extract contract negotiation fields for Dataspace Protocol support
    const counterPartyAddress = cs['dcat:endpointURL'];
    const counterPartyId = cs['dspace:participantId'];

    // Asset ID: strip urn:uuid: prefix from the credentialSubject @id
    const assetId = this.stripUrnPrefix(cs['@id'], 'urn:uuid:');

    // Dataset ID and policy: only available when dcat:dataset is present
    let datasetId: string | undefined;
    let policy: any | undefined;

    if (cs['dcat:dataset'] && cs['dcat:dataset'].length > 0) {
      const dataset = cs['dcat:dataset'][0];

      // Strip urn:uuid: prefix from dataset @id
      if (dataset['@id']) {
        datasetId = this.stripUrnPrefix(dataset['@id'], 'urn:uuid:');
      }

      // Extract and process policy if present
      if (dataset['odrl:hasPolicy']) {
        // Deep clone the policy and strip urn:tems: from all @id properties
        policy = this.stripTemsUrnFromPolicy(
          JSON.parse(JSON.stringify(dataset['odrl:hasPolicy'])),
        );

        // Add the target field pointing to the dataset ID (with urn:uuid: prefix stripped)
        if (datasetId) {
          policy.target = datasetId;
        }
      }
    }

    // 13) Assemble the Destination object
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
      // Contract negotiation fields (only included if available)
      ...(counterPartyAddress && { counterPartyAddress }),
      ...(counterPartyId && { counterPartyId }),
      ...(assetId && { assetId }),
      ...(datasetId && { datasetId }),
      ...(policy && { policy }),
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
