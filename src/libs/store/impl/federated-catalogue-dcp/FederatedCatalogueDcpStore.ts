import type * as JSONLDContextParser from 'jsonld-context-parser';
import type { CacheManagerInterface } from '../../cache/CacheManager.ts';
import { InMemoryCacheManager } from '../../cache/InMemory.ts';
import type { ServerPaginationOptions } from '../../shared/options/server-pagination.ts';
import type { ServerSearchOptions } from '../../shared/options/server-search.ts';
import type { IStore, Resource, StoreConfig } from '../../shared/types.ts';
import { getFederatedCatalogueDcpAPIWrapper } from './FederatedCatalogueDcpAPIWrapper-instance.ts';
import type { FederatedCatalogueDcpAPIWrapper } from './FederatedCatalogueDcpAPIWrapper.ts';
import type {
  DcpCatalog,
  DcpDataService,
  DcpDataset,
  Destination,
  MapperOptions,
} from './interfaces.ts';

/**
 * IStore implementation backed by the DCP-flavored EDC Federated Catalog
 * extension.
 *
 * Wire shape: `POST /v1alpha/catalog/query` → `dcat:Catalog[]`.
 * The server aggregates each crawled participant's DSP catalog into an
 * item of that array. The store flattens the datasets across participants
 * into one ldp:Container so downstream `<solid-display>`-shaped consumers
 * see one homogeneous list.
 *
 * MVP scope (#26 first deliverable):
 *   - Unauthenticated read path only (DCP FC accepts anonymous by default).
 *     Consumers still send whatever token they have via the injected fetch,
 *     the server just doesn't validate it (see project_tems_management_api…
 *     memory — Mgmt API path stays dual-auth, unrelated to this store).
 *   - No delta caching (no sdHash concept on the DCP side). Every getData
 *     fetches the aggregated catalog fresh. Optimization can come later.
 *   - Skeleton mapper — full v0.2.0 schema alignment is issue #28.
 */
export class FederatedCatalogueDcpStore implements IStore<any> {
  cache: CacheManagerInterface;
  private api: FederatedCatalogueDcpAPIWrapper | null = null;
  private isFetching = false;
  private pendingGetData: Promise<any> | null = null;

  constructor(private cfg: StoreConfig) {
    if (!this.cfg.endpoint) {
      throw new Error(
        'Missing required `endpoint` in StoreConfig for FederatedCatalogueDcpStore',
      );
    }
    this.api = getFederatedCatalogueDcpAPIWrapper(this.cfg.endpoint);
    this.cache = new InMemoryCacheManager();
  }

  disconnectedCallback() {}

  private buildContainerId(containerType = 'default'): string {
    // Deterministic per-endpoint so multiple <solid-display> against the
    // same store share the container.
    return `store://local.${this.cfg.endpoint}.${containerType}`;
  }

  private resolveTargetType(args: any): string {
    if (args && typeof args === 'object' && 'rdf-type' in args) {
      return String(args['rdf-type']);
    }
    // Default: no filter — the container returns all datasets.
    return '';
  }

  async getData(args: any) {
    // Match FederatedCatalogueStore's re-entrancy guard shape so downstream
    // event loops (save → cache-invalidate → refetch) don't stampede.
    if (this.isFetching) {
      if (this.pendingGetData) return this.pendingGetData;
      return null;
    }
    this.isFetching = true;

    const execute = async (): Promise<Resource> => {
      const targetType = this.resolveTargetType(args);
      if (!this.api) return this.initLocalDataSourceContainer();

      let payload: DcpCatalog[] = [];
      try {
        payload = await this.api.getAggregatedCatalog();
      } catch (err) {
        console.error(
          '[FederatedCatalogueDcpStore] Fetch failed; returning empty container.',
          err,
        );
        return this.initLocalDataSourceContainer();
      }

      const opts: MapperOptions = {
        temsServiceBase: this.cfg.temsServiceBase as string | undefined,
        temsOfferBase: (this.cfg as any).temsOfferBase as string | undefined,
        temsCategoryBase: this.cfg.temsCategoryBase as string | undefined,
        temsImageBase: this.cfg.temsImageBase as string | undefined,
        temsProviderBase: this.cfg.temsProviderBase as string | undefined,
      };

      const items: Destination[] = [];
      for (const catalog of payload) {
        const datasets = this.normalizeDatasets(catalog['dcat:dataset']);
        for (const ds of datasets) {
          const mapped = this.mapDatasetToDestination(ds, catalog, opts);
          if (!targetType || mapped['@type'].includes(targetType)) {
            items.push(mapped);
          }
        }
      }

      const container: Resource = {
        '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
        '@type': 'ldp:Container',
        '@id': this.buildContainerId(targetType || 'default'),
        'ldp:contains': items,
        permissions: ['view'],
      };
      await this.cache.set(container['@id'] as string, container);
      // Cache each item under its own @id too so <solid-display use-id> lookups resolve.
      for (const item of items) {
        if (item['@id']) await this.cache.set(item['@id'], item);
      }
      this.notifyComponents(container['@id'] as string, container);
      return container;
    };

    this.pendingGetData = execute().finally(() => {
      this.isFetching = false;
      this.pendingGetData = null;
    });
    return this.pendingGetData;
  }

  private normalizeDatasets(v: DcpDataset | DcpDataset[] | undefined): DcpDataset[] {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }

  private normalizeServices(
    v: DcpDataService | DcpDataService[] | undefined,
  ): DcpDataService[] {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }

  private mapDatasetToDestination(
    ds: DcpDataset,
    catalog: DcpCatalog,
    _opts: MapperOptions,
  ): Destination {
    // @id: bare urn:uuid per project_tems_transition_state — the router
    // treats it opaquely and the mapping stays URL-encodable.
    const rawId = String(ds['@id'] ?? ds.id ?? '');
    const bareUuid = rawId.replace(/^urn:uuid:/i, '');
    const id = bareUuid ? `urn:uuid:${bareUuid}` : rawId;

    // Datasets often carry a nested dcat:service with the actual title +
    // description; the top-level ds may only have the ID + policy binding.
    const datasetServices = this.normalizeServices(ds['dcat:service']);
    const catalogServices = this.normalizeServices(catalog['dcat:service']);
    const serviceForMeta =
      datasetServices[0] ?? catalogServices[0] ?? ({} as DcpDataService);

    const title =
      String(ds['dct:title'] ?? serviceForMeta['dct:title'] ?? '') || undefined;
    const description =
      String(
        ds['rdfs:comment'] ?? serviceForMeta['rdfs:comment'] ?? '',
      ) || undefined;

    const rawKeywords = ds['dcat:keyword'] ?? serviceForMeta['dcat:keyword'];
    const keywords = Array.isArray(rawKeywords)
      ? rawKeywords.map(String)
      : rawKeywords
        ? [String(rawKeywords)]
        : undefined;

    const version = ds['dcat:version']
      ? String(ds['dcat:version'])
      : serviceForMeta['dcat:version']
        ? String(serviceForMeta['dcat:version'])
        : undefined;

    const providerId = catalog['dspace:participantId'];
    const providerAddress =
      (catalogServices[0]?.['dcat:endpointURL'] as string | undefined) ??
      (catalogServices[0]?.['dcat:endpointUrl'] as string | undefined) ??
      catalog.originator;

    // Type discrimination — DCP DCAT payloads don't natively carry the
    // TEMS Service vs DataOffer distinction, so downstream consumers filter
    // via other properties. The MVP tags both with tems:Object; the
    // v0.2.0 schema alignment work (#28) reads rdf:type / tc:offeringKind.
    const type = ['tems:Object'];

    return {
      '@id': id,
      '@type': type,
      name: title,
      description,
      keywords,
      version,
      provider: providerId || providerAddress
        ? {
            '@id': providerId,
            name: providerId,
            address: providerAddress as string | undefined,
          }
        : undefined,
      images: [],
      // Contract-negotiation surface — preserve fields tems-modal expects
      // when negotiating an offer sourced from this store.
      counterPartyId: providerId,
      counterPartyAddress: providerAddress as string | undefined,
      assetId: id,
      datasetId: id,
      policy: ds['odrl:hasPolicy'],
      _rawDataset: ds,
      _rawCatalog: {
        '@id': catalog['@id'],
        'dspace:participantId': catalog['dspace:participantId'],
        originator: catalog.originator,
      },
    };
  }

  async initLocalDataSourceContainer(
    dataSrc = '',
    containerType = 'default',
  ) {
    if (!dataSrc) dataSrc = this.buildContainerId(containerType);
    const localContainer: Resource = {
      '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
      '@type': 'ldp:Container',
      '@id': dataSrc,
      'ldp:contains': [] as any[],
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
      return (await this.cache.get(id)) || null;
    } catch (error) {
      console.error(
        `[FederatedCatalogueDcpStore] Error getting resource ${id}:`,
        error,
      );
      return null;
    }
  }

  post(_r: object, _id: string, _s?: boolean) { return Promise.resolve(null); }
  put(_r: object, _id: string, _s?: boolean) { return Promise.resolve(null); }
  patch(_r: object, _id: string, _s?: boolean) { return Promise.resolve(null); }
  delete(
    _id: string,
    _c?: JSONLDContextParser.JsonLdContextNormalized | null,
  ) {
    return Promise.resolve(null);
  }

  async clearCache(id: string) {
    try {
      if (await this.cache.has(id)) await this.cache.delete(id);
    } catch (error) {
      console.error(
        `[FederatedCatalogueDcpStore] Error clearing cache for ${id}:`,
        error,
      );
    }
  }

  async cacheResource(key: string, resourceProxy: any) {
    try {
      await this.cache.set(key, resourceProxy);
    } catch (error) {
      console.error(
        `[FederatedCatalogueDcpStore] Error caching resource ${key}:`,
        error,
      );
    }
  }

  _getLanguage() { return ''; }
  selectLanguage(_selectedLanguageCode: string) {}

  getExpandedPredicate(
    _property: string,
    _context: JSONLDContextParser.JsonLdContextNormalized | null,
  ) {
    return null;
  }
  subscribeResourceTo(_resourceId: string, _nestedResourceId: string) {}

  async fetchAuthn(_iri: string, _options: any) {
    return await Promise.resolve({} as Response);
  }

  async setLocalData(resource: object, id: string): Promise<string | null> {
    try {
      const resourceWithId = { ...resource, '@id': id };
      await this.cache.set(id, resourceWithId);
      this.notifyComponents(id, resourceWithId);
      return id;
    } catch (error) {
      console.error(
        `[FederatedCatalogueDcpStore] Error storing local data for ${id}:`,
        error,
      );
      return null;
    }
  }

  notifyComponents(id: string, resource: Resource) {
    document.dispatchEvent(
      new CustomEvent('resoureReady', {
        detail: { id, resource, fetchedResource: resource },
        bubbles: true,
      }),
    );
  }
}

export class FederatedCatalogueDcpStoreAdapter {
  private constructor() {}

  private static validateConfiguration(cfg: StoreConfig): void {
    if (!cfg.endpoint) {
      throw new Error(
        '[FederatedCatalogueDcpStoreAdapter] `endpoint` is required in StoreConfig',
      );
    }
  }

  public static getStoreInstance(cfg?: StoreConfig): IStore<any> {
    if (!cfg) {
      throw new Error(
        '[FederatedCatalogueDcpStoreAdapter] configuration is required',
      );
    }
    FederatedCatalogueDcpStoreAdapter.validateConfiguration(cfg);
    // A fresh instance per config — mirrors FederatedCatalogueStoreAdapter.
    return new FederatedCatalogueDcpStore(cfg);
  }
}
