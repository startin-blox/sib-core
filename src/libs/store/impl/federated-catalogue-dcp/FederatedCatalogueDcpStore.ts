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

// --- module-level JSON-LD extraction helpers --------------------------------
function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

/** Accepts a URI-object (`{"@id": ...}`) or bare string; returns the URI or undefined. */
function readObjectId(v: unknown): string | undefined {
  if (typeof v === 'string' && v.length > 0) return v;
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const id = (v as { '@id'?: unknown })['@id'];
    if (typeof id === 'string' && id.length > 0) return id;
  }
  return undefined;
}

function readString(v: unknown): string | undefined {
  if (typeof v === 'string') return v.length > 0 ? v : undefined;
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const value = (v as { '@value'?: unknown })['@value'];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function readIsoDate(v: unknown): string | undefined {
  const s = readString(v);
  return s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s : undefined;
}

/** Normalize `dcat:theme` / `dcterms:language` (scalar OR array of URI-objects) to string[]. */
function normalizeUriObjects(v: unknown): string[] {
  return toArray(v as unknown[])
    .map(readObjectId)
    .filter((u): u is string => !!u);
}

/**
 * Extract the v0.2.0 rdf:type discriminator from a DCP dataset. The crawler
 * flattens `properties.rdf:type` as a sibling of the dcat:Dataset wrapper,
 * but different @context expansions may leave it as a bare string or as a
 * `{"@id": "dcat:DataService"}` object. The wrapper `@type` is always
 * `"dcat:Dataset"` regardless of the underlying asset — do not use it.
 */
function extractRdfType(ds: DcpDataset): string | undefined {
  const raw = ds['rdf:type'];
  const s = typeof raw === 'string' ? raw : readObjectId(raw);
  if (!s) return undefined;
  const norm = s.replace(/^http:\/\/www\.w3\.org\/ns\/dcat#/, 'dcat:');
  return norm;
}

/**
 * DSP JSON-LD serialization from EDC connectors emits fields under EXPANDED
 * URIs whenever the emitting context lacks the relevant prefix. TEMS assets
 * carry `tc:`, `foaf:`, `rdf:` fields that the connector's baked-in context
 * doesn't know, so those come across as full URIs. Normalize both directions
 * on a shallow copy so downstream readers can use the compact forms.
 */
const URI_TO_PREFIX: Record<string, string> = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf:',
  'http://purl.org/dc/terms/': 'dct:',
  'http://xmlns.com/foaf/0.1/': 'foaf:',
  'http://tems.org/2024/temscore#': 'tc:',
  'http://www.w3.org/ns/dcat#': 'dcat:',
  'http://www.w3.org/2006/vcard/ns#': 'vcard:',
  'http://www.w3.org/ns/odrl/2/': 'odrl:',
};

function normalizeJsonLdKeys<T>(v: T): T {
  if (Array.isArray(v)) return v.map(normalizeJsonLdKeys) as unknown as T;
  if (!v || typeof v !== 'object') return v;
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    let key = k;
    for (const uri of Object.keys(URI_TO_PREFIX)) {
      if (k.startsWith(uri)) {
        key = URI_TO_PREFIX[uri] + k.slice(uri.length);
        break;
      }
    }
    out[key] = normalizeJsonLdKeys(val);
  }
  return out as unknown as T;
}

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
    if (!args || typeof args !== 'object') return '';
    // orbitFcComponent's _getProxyValue passes { targetType }; the
    // sib-router path passes { 'rdf-type' } — accept both.
    if ('targetType' in args && args.targetType) return String(args.targetType);
    if ('rdf-type' in args) return String(args['rdf-type']);
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

      const own = this.cfg.ownParticipantId?.toLowerCase();
      const items: Destination[] = [];
      for (const catalog of payload) {
        if (own && this.isOwnCatalog(catalog, own)) continue;
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

  private normalizeDatasets(
    v: DcpDataset | DcpDataset[] | undefined,
  ): DcpDataset[] {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }

  private normalizeServices(
    v: DcpDataService | DcpDataService[] | undefined,
  ): DcpDataService[] {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }

  private isOwnCatalog(catalog: DcpCatalog, ownLower: string): boolean {
    const pid = String(catalog['dspace:participantId'] ?? '').toLowerCase();
    return pid !== '' && pid === ownLower;
  }

  private mapDatasetToDestination(
    rawDs: DcpDataset,
    catalog: DcpCatalog,
    _opts: MapperOptions,
  ): Destination {
    // Normalize expanded URIs (rdf:, foaf:, tc:, …) to compact form.
    const ds = normalizeJsonLdKeys(rawDs) as DcpDataset;
    // bare urn:uuid — sib-router treats @id opaquely (project_tems_transition_state).
    const rawId = String(ds['@id'] ?? ds.id ?? '');
    const bareUuid = rawId.replace(/^urn:uuid:/i, '');
    const id = bareUuid ? `urn:uuid:${bareUuid}` : rawId;

    // Datasets often carry a nested dcat:service with the actual title +
    // description; the top-level ds may only have the ID + policy binding.
    const datasetServices = this.normalizeServices(ds['dcat:service']);
    const catalogServices = this.normalizeServices(catalog['dcat:service']);
    const serviceForMeta =
      datasetServices[0] ?? catalogServices[0] ?? ({} as DcpDataService);

    // Title/description: prefer v0.2.0 dcterms:*, fall back to legacy dct:*/rdfs:comment.
    const title = readString(
      ds['dcterms:title'] ??
        ds['dct:title'] ??
        serviceForMeta['dcterms:title'] ??
        serviceForMeta['dct:title'],
    );
    const description = readString(
      ds['dcterms:description'] ??
        (ds as any)['dct:description'] ??
        ds['rdfs:comment'] ??
        serviceForMeta['dcterms:description'] ??
        (serviceForMeta as any)['dct:description'] ??
        serviceForMeta['rdfs:comment'],
    );

    const rawKeywords = ds['dcat:keyword'] ?? serviceForMeta['dcat:keyword'];
    const keywords = Array.isArray(rawKeywords)
      ? rawKeywords.map(String)
      : rawKeywords
        ? [String(rawKeywords)]
        : undefined;

    const version = readString(
      ds['dcat:version'] ?? serviceForMeta['dcat:version'],
    );

    // rdf:type discrimination — enables the modal's Negotiate CTA.
    const rdfType = extractRdfType(ds);

    // Publisher preferred over raw DID for human-readable display.
    const publisher = ds['dcterms:publisher'] ?? (ds as any)['dct:publisher'];
    const providerId = publisher?.['@id'] ?? catalog['dspace:participantId'];
    const providerName = publisher?.['foaf:name'] ?? providerId;
    const providerLogo = readObjectId(publisher?.['foaf:depiction']);

    const endpointUrl = readObjectId(ds['dcat:endpointURL']);
    const endpointDescription = readObjectId(ds['dcat:endpointDescription']);

    const providerAddress =
      endpointUrl ??
      (catalogServices[0]?.['dcat:endpointURL'] as string | undefined) ??
      (catalogServices[0]?.['dcat:endpointUrl'] as string | undefined) ??
      catalog.originator;

    // Types: always tems:Object, plus tems:Service or tems:DataOffer per rdf:type.
    const type: string[] = ['tems:Object'];
    if (rdfType === 'dcat:DataService') type.push('tems:Service');
    else if (rdfType === 'dcat:Dataset') type.push('tems:DataOffer');

    const bannerUrl = readObjectId(ds['foaf:depiction']);
    const images: string[] = [];
    if (bannerUrl) images.push(bannerUrl);

    const themes = normalizeUriObjects(ds['dcat:theme']).map(uri => ({ uri }));
    const languages = normalizeUriObjects(
      ds['dcterms:language'] ?? (ds as any)['dct:language'],
    ).map(uri => ({ uri }));
    const conformsTo = toArray(
      ds['dcterms:conformsTo'] ?? (ds as any)['dct:conformsTo'],
    ).map(c => {
      const cAny = c as any;
      const title = c['dcterms:title'] ?? cAny['dct:title'];
      const desc = cAny['dcterms:description'] ?? cAny['dct:description'];
      return {
        '@id': String(c['@id']),
        ...(title ? { 'dcterms:title': String(title) } : {}),
        ...(desc ? { 'dcterms:description': String(desc) } : {}),
      };
    });
    const contact = ds['dcat:contactPoint'];
    const contactPoint = contact?.['vcard:fn']
      ? {
          name: String(contact['vcard:fn']),
          email: String(contact['vcard:hasEmail'] ?? '').replace(
            /^mailto:/i,
            '',
          ),
        }
      : undefined;

    const distributions =
      rdfType === 'dcat:Dataset'
        ? toArray(ds['dcat:distribution']).map(d => {
            const accessUrl = readObjectId((d as any)['dcat:accessURL']) ?? '';
            const byteSize = (d as any)['dcat:byteSize'];
            return {
              accessUrl,
              ...(typeof byteSize === 'number' ? { byteSize } : {}),
            };
          })
        : undefined;

    const hostingCountry = readString(ds['tc:hostingCountry'])?.toUpperCase();
    const issued = readIsoDate(
      ds['dcterms:issued'] ?? (ds as any)['dct:issued'],
    );
    const identifier = readString(
      ds['dcterms:identifier'] ?? (ds as any)['dct:identifier'],
    );

    return {
      '@id': id,
      '@type': type,
      name: title,
      description,
      keywords,
      version,
      provider:
        providerId || providerAddress
          ? {
              '@id': providerId,
              name: providerName ?? providerId,
              address: providerAddress as string | undefined,
              ...(providerLogo ? { logoUrl: providerLogo } : {}),
            }
          : undefined,
      images,
      // v0.2.0 pass-through
      identifier,
      rdfType: rdfType as Destination['rdfType'],
      issued,
      themes: themes.length > 0 ? themes : undefined,
      languages: languages.length > 0 ? languages : undefined,
      hostingCountry,
      conformsTo: conformsTo.length > 0 ? conformsTo : undefined,
      contactPoint,
      distributions: (distributions?.length ?? 0) > 0 ? distributions : undefined,
      endpointUrl,
      endpointDescription,
      bannerUrl,
      // Contract-negotiation surface — preserve fields tems-modal expects
      // when negotiating an offer sourced from this store.
      counterPartyId: providerId,
      counterPartyAddress: providerAddress as string | undefined,
      assetId: id,
      datasetId: id,
      policy: ds['odrl:hasPolicy'],
      _rawDataset: rawDs,
      _rawCatalog: {
        '@id': catalog['@id'],
        'dspace:participantId': catalog['dspace:participantId'],
        originator: catalog.originator,
      },
    };
  }

  async initLocalDataSourceContainer(dataSrc = '', containerType = 'default') {
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

  post(_r: object, _id: string, _s?: boolean) {
    return Promise.resolve(null);
  }
  put(_r: object, _id: string, _s?: boolean) {
    return Promise.resolve(null);
  }
  patch(_r: object, _id: string, _s?: boolean) {
    return Promise.resolve(null);
  }
  delete(_id: string, _c?: JSONLDContextParser.JsonLdContextNormalized | null) {
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
