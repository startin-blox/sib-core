import type * as JSONLDContextParser from 'jsonld-context-parser';
import { AuthFetchResolver } from '../../auth/AuthFetchResolver.ts';
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
import type {
  FederatedCatalogueAPIWrapper,
  KeycloakLoginOptions,
} from './FederatedCatalogueAPIWrapper.ts';
import type { DcatService, Destination, Source } from './interfaces.ts';

/**
 * Check if auth element has a valid authenticated session
 * Uses the auth element's isAuthenticated() method if available, otherwise checks localStorage
 */
async function checkAuthElementReady(authElement: Element): Promise<boolean> {
  try {
    // First, try using the auth element's isAuthenticated method
    if (typeof (authElement as any).isAuthenticated === 'function') {
      const isAuth = await (authElement as any).isAuthenticated();
      if (isAuth) {
        return true;
      }
    }

    // Also check if getAccessToken returns a value
    if (typeof (authElement as any).getAccessToken === 'function') {
      const token = await (authElement as any).getAccessToken();
      if (token) {
        return true;
      }
    }

    // Fallback: check localStorage for OIDC token
    const provider = authElement.querySelector(
      'sib-auth-provider-oidc',
    ) as HTMLElement | null;
    const authority = provider?.dataset?.authority;
    const clientId =
      provider?.dataset?.clientId || provider?.dataset?.clientName;

    if (authority && clientId) {
      const storageKey = `oidc.user:${authority}:${clientId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const user = JSON.parse(stored);
        if (
          user.expires_at &&
          user.expires_at * 1000 > Date.now() &&
          user.access_token
        ) {
          return true;
        }
      }
    }
  } catch (error) {
    console.warn('[FederatedCatalogueStore] Error checking auth ready:', error);
  }
  return false;
}

/**
 * Wait for auth element to have an active authenticated session
 * This handles the race condition where sib-auth:activated fires before token exchange completes
 */
async function waitForAuthReady(maxWaitMs = 5000): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 100;

  while (Date.now() - startTime < maxWaitMs) {
    const authElement = AuthFetchResolver.findAuthElement();
    if (authElement && (await checkAuthElementReady(authElement))) {
      console.log('[FederatedCatalogueStore] Auth is now ready');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  console.warn(
    `[FederatedCatalogueStore] Timed out waiting for auth after ${maxWaitMs}ms`,
  );
  return false;
}

export class FederatedCatalogueStore implements IStore<any> {
  cache: CacheManagerInterface;
  private fcApi: FederatedCatalogueAPIWrapper | null = null;
  private metadataManager: LocalStorageCacheMetadataManager | null;
  private enableCaching: boolean;
  private cleanupAuth?: () => void;
  private isFetching = false; // Guard against concurrent/recursive getData calls
  private pendingGetData: Promise<any> | null = null;

  constructor(private cfg: StoreConfig) {
    if (!this.cfg.endpoint) {
      throw new Error(
        'Missing required `endpoint` in StoreConfig for FederatedCatalogueStore',
      );
    }

    // Always listen for auth activation events
    this.cleanupAuth = AuthFetchResolver.onAuthActivated(
      this.resolveFetch.bind(this),
    );

    if (this.cfg.login) {
      // Use configured Keycloak credentials - can initialize immediately
      const fetchAuth = AuthFetchResolver.getAuthFetch();
      this.fcApi = getFederatedCatalogueAPIWrapper(
        this.cfg.endpoint,
        this.cfg.login as KeycloakLoginOptions,
        fetchAuth,
      );
    } else {
      // No login config - we rely on sib-auth OIDC
      // Initialize fcApi asynchronously once auth is confirmed ready
      this.initializeWithOidcAuth();
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

  disconnectedCallback() {
    this.cleanupAuth?.();
  }

  /**
   * Initialize the store with OIDC authentication
   * Only proceeds once auth is confirmed ready with a valid token
   */
  private async initializeWithOidcAuth(): Promise<void> {
    if (!this.cfg.endpoint) {
      console.warn(
        '[FederatedCatalogueStore] No endpoint configured, skipping OIDC initialization',
      );
      return;
    }

    const authElement = AuthFetchResolver.findAuthElement();
    if (!authElement) {
      console.log(
        '[FederatedCatalogueStore] No auth element found, waiting for auth activation event',
      );
      return;
    }

    // Check if auth is already ready
    const isReady = await checkAuthElementReady(authElement);
    if (isReady) {
      const fetchAuth = (authElement as any).getFetch?.();
      if (typeof fetchAuth === 'function') {
        console.log(
          '[FederatedCatalogueStore] Auth is ready, initializing fcApi',
        );
        this.fcApi = getFederatedCatalogueAPIWrapper(
          this.cfg.endpoint,
          {} as KeycloakLoginOptions,
          fetchAuth,
        );
      }
    } else {
      console.log(
        '[FederatedCatalogueStore] Auth not ready yet, will wait for activation event',
      );
    }
  }

  /**
   * Resolve fetch and session from auth activation event
   * @param event - sib-auth:activated event
   */
  resolveFetch = async (event: any) => {
    if (!this.cfg.endpoint) {
      throw new Error(
        'Missing required `endpoint` in StoreConfig for FederatedCatalogueStore',
      );
    }
    if (event.detail.fetch) {
      // Wait for auth to be truly ready (token available) before initializing
      // This handles the race condition where the event fires before token exchange completes
      console.log(
        '[FederatedCatalogueStore] Auth activation event received, verifying token is ready...',
      );

      const isReady = await waitForAuthReady(5000);
      if (!isReady) {
        console.warn(
          '[FederatedCatalogueStore] Auth activation event received but token not ready, skipping initialization',
        );
        return;
      }

      // When using authenticated fetch from sib-auth, pass empty login options
      // This tells FederatedCatalogueAPIWrapper to use the fetch directly
      // instead of doing its own Keycloak token management
      this.fcApi = getFederatedCatalogueAPIWrapper(
        this.cfg.endpoint,
        {} as KeycloakLoginOptions,
        event.detail.fetch,
      );

      // Trigger a refetch now that auth is ready
      // This fixes the race condition where initial fetch returned empty due to missing auth
      console.log(
        '[FederatedCatalogueStore] Auth verified and ready, triggering data refetch',
      );
      this.triggerRefetch();
    }
  };

  /**
   * Trigger a refetch of data by dispatching a save event for the container
   * This causes components bound to this store to refresh their data
   */
  private async triggerRefetch(): Promise<void> {
    // Small delay to ensure fcApi is fully ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Use the endpoint URL for the save event - this contains "fc" keyword
    // and doesn't start with "store://" which would be filtered out
    const resourceId = this.cfg.endpoint || this.buildContainerId();

    // Dispatch save event to trigger component refresh
    // The fc-catalog component listens for 'save' events with keywords like "fc"
    document.dispatchEvent(
      new CustomEvent('save', {
        detail: { resource: { '@id': resourceId } },
        bubbles: true,
      }),
    );

    // Also dispatch a specific event for stores that need explicit refresh
    document.dispatchEvent(
      new CustomEvent('fc-store-auth-ready', {
        detail: { storeEndpoint: this.cfg.endpoint, containerId: resourceId },
        bubbles: true,
      }),
    );
  }

  /**
   * Handle page reload detection and clear cache if it's a new session
   */
  private handlePageReload(): void {
    try {
      const SESSION_KEY = 'fc-session-id';

      // Generate or retrieve session ID
      let sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        // New session - generate unique ID and clear cache
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem(SESSION_KEY, sessionId);

        // Clear localStorage cache on fresh page load (new session)
        this.metadataManager?.clear();
      }

      const stats = this.metadataManager?.getCacheStats();
      if (stats) {
      }
    } catch (error) {
      console.warn(
        '[FederatedCatalogueStore] Error handling page reload:',
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

  /**
   * Build deterministic local container id based on endpoint and container type.
   */
  private buildContainerId(containerType = 'default'): string {
    const endpointHash =
      this.cfg.endpoint?.replace(/[^a-zA-Z0-9]/g, '') || 'unknown';
    return `store://local.fc-${endpointHash}-${containerType}/`;
  }

  async getData(args: any) {
    // Guard against recursive/concurrent calls (e.g., from save event triggering cache invalidation)
    if (this.isFetching) {
      if (this.pendingGetData) {
        return this.pendingGetData;
      }
      // Already fetching but no pending promise - just return empty to break the loop
      return null;
    }

    // Set guard immediately before any processing
    this.isFetching = true;

    const executeGetData = async (): Promise<any> => {
      const targetType = this.resolveTargetType(args);

      if (!this.fcApi) {
        // API not initialized yet (waiting for auth), return empty container
        console.warn(
          '[FederatedCatalogueStore] API not initialized yet, waiting for auth activation',
        );
        return await this.initLocalDataSourceContainer();
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
      }

      return await this.getFullData(targetType);
    };

    this.pendingGetData = executeGetData().finally(() => {
      this.isFetching = false;
      this.pendingGetData = null;
    });

    return this.pendingGetData;
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
        resource['@id'] = this.buildContainerId();
      }
      if (!resource['ldp:contains']) {
        resource['ldp:contains'] = [];
      }

      // Get known hashes from metadata
      const knownHashes = this.metadataManager.getKnownHashes();

      // Safety check for apiList.items
      const items = apiList?.items || [];
      if (!Array.isArray(items)) {
        console.warn('[FederatedCatalogueStore] apiList.items is not an array');
        return resource; // Return empty container instead of falling back
      }

      const apiHashes = new Set(items.map(item => item.meta.sdHash));

      // Compute delta
      const newHashes: string[] = [];
      const updatedHashes: string[] = [];
      const deletedHashes: string[] = [];

      // Find new and updated items
      for (const item of items) {
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
  private async getFullData(_targetType: string): Promise<Resource> {
    if (!this.fcApi) {
      console.warn(
        '[FederatedCatalogueStore] API not initialized yet, waiting for auth',
      );
      return await this.initLocalDataSourceContainer();
    }

    const resource = await this.initLocalDataSourceContainer();
    const dataset = await this.fcApi.getAllSelfDescriptions();

    const newMetadata: CacheItemMetadata[] = [];

    if (dataset?.items && Array.isArray(dataset.items)) {
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
    if (!dataSrc) {
      dataSrc = this.buildContainerId(containerType);
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

  async fetchAuthn(_iri: string, _options: any) {
    // if (!this.fetch) {
    //   console.warn('No fetch method available');
    // }

    // // Check if the session is available
    // // If not, wait for it to be available
    // let authenticated = false;
    // if (this.session) authenticated = await this.session;

    // if (this.fetch && authenticated) {
    //   // authenticated
    //   return this.fetch(iri, options);
    // }

    // // anonymous
    // if (options.headers) {
    //   options.headers = new Headers(options.headers);
    // }
    // return fetch(iri, options).then(response => response);
    return await Promise.resolve({} as Response);
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
    let policies: any[] = [];

    if (cs['dcat:dataset'] && cs['dcat:dataset'].length > 0) {
      const dataset = cs['dcat:dataset'][0];

      // Strip urn:uuid: prefix from dataset @id
      if (dataset['@id']) {
        datasetId = this.stripUrnPrefix(dataset['@id'], 'urn:uuid:');
      }

      // Extract and process policy/policies if present
      if (dataset['odrl:hasPolicy']) {
        const rawPolicy = dataset['odrl:hasPolicy'];

        // Helper to process a single policy
        const processSinglePolicy = (policyObj: any) => {
          // Deep clone the policy and strip urn:tems: from all @id properties
          const processedPolicy = this.stripTemsUrnFromPolicy(
            JSON.parse(JSON.stringify(policyObj)),
          );

          // Add the target field pointing to the dataset ID (with urn:uuid: prefix stripped)
          if (datasetId) {
            processedPolicy.target = datasetId;
          }

          return processedPolicy;
        };

        // Handle both single policy and array of policies
        if (Array.isArray(rawPolicy)) {
          policies = rawPolicy.map(processSinglePolicy);
          // Use first policy as default for backwards compatibility
          policy = policies[0];
        } else {
          policy = processSinglePolicy(rawPolicy);
          policies = [policy];
        }
      }
    }

    // DEBUG: Log policy processing results
    console.log(
      '[FederatedCatalogueStore] 🔍 Policy processing for',
      name,
      ':',
      {
        hasPolicy: !!policy,
        policiesCount: policies.length,
        policy: policy
          ? { '@id': policy['@id'], hasTarget: !!policy.target }
          : null,
        policies: policies.map(p => ({
          '@id': p['@id'],
          hasTarget: !!p.target,
        })),
      },
    );

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
      ...(policies.length > 0 && { policies }), // Store all available policies
    };

    console.log(
      '[FederatedCatalogueStore] 🔍 Destination object contract fields:',
      {
        hasPolicy: 'policy' in dest,
        hasPolicies: 'policies' in dest,
        policiesValue: (dest as any).policies,
      },
    );

    return dest;
  }
}

export class FederatedCatalogueStoreAdapter {
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
    if (!cfg) {
      throw new Error(
        '[FederatedCatalogueStoreAdapter] configuration is required',
      );
    }

    FederatedCatalogueStoreAdapter.validateConfiguration(cfg);
    // Always create a new instance to support multiple stores with different configs
    return new FederatedCatalogueStore(cfg);
  }
}
