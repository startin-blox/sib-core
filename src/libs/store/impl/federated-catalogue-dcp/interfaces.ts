// Types for the DCP-flavored EDC Federated Catalog extension responses.
//
// The DCP FC exposes `POST /v1alpha/catalog/query` returning an array of
// `dcat:Catalog` payloads, one per crawled target-node participant. Each
// catalog carries the aggregated `dcat:dataset` list for that participant
// plus service/participant metadata.
//
// Only the fields the store actually reads at runtime are typed here; the
// mapper accepts loose JSON-LD and reads what it needs.

export interface DcpCatalog {
  '@id': string;
  '@type': 'dcat:Catalog' | string;
  'dcat:dataset'?: DcpDataset | DcpDataset[];
  'dcat:distribution'?: unknown[];
  'dcat:service'?: DcpDataService | DcpDataService[];
  'dspace:participantId'?: string;
  originator?: string;
  '@context'?: Record<string, string>;
}

export interface DcpDataset {
  '@id': string;
  '@type': 'dcat:Dataset' | string;
  id?: string;
  'odrl:hasPolicy'?: unknown;
  'dcat:distribution'?: unknown[];
  'dcat:service'?: DcpDataService | DcpDataService[];
  'dct:title'?: string;
  'rdfs:comment'?: string;
  'dcat:keyword'?: string | string[];
  'dcat:version'?: string;
  'dct:creator'?: unknown;
  [k: string]: unknown;
}

export interface DcpDataService {
  '@id'?: string;
  '@type'?: 'dcat:DataService' | string;
  'dct:title'?: string;
  'rdfs:comment'?: string;
  'dcat:endpointDescription'?: string;
  'dcat:endpointUrl'?: string;
  'dcat:endpointURL'?: string;
  [k: string]: unknown;
}

/** Response body of `POST /v1alpha/catalog/query`. */
export type DcpCatalogQueryResponse = DcpCatalog[];

/**
 * Shape emitted by the store per dataset. Mirrors the destination shape of
 * the existing FederatedCatalogueStore so downstream mappers in
 * solid-tems-shared / solid-tems-v2 continue to work unchanged.
 *
 * Full field alignment against the v0.2.0 JSON schemas is issue #28.
 */
export interface Destination {
  '@id': string;
  '@type': string[];
  name?: string;
  description?: string;
  keywords?: string[];
  version?: string;
  provider?: {
    '@id'?: string;
    name?: string;
    address?: string;
  };
  categories?: unknown[];
  images?: unknown[];
  // Contract-negotiation surface preserved from the XFSC store so tems-modal
  // still finds what it needs when the user negotiates against a DCP-sourced
  // offer.
  counterPartyAddress?: string;
  counterPartyId?: string;
  assetId?: string;
  datasetId?: string;
  policy?: unknown;
  policies?: unknown[];
  // Raw source is kept for downstream consumers that need fields not yet
  // surfaced in the typed shape.
  _rawDataset?: DcpDataset;
  _rawCatalog?: Pick<DcpCatalog, '@id' | 'dspace:participantId' | 'originator'>;
}

export interface MapperOptions {
  /** Optional bases retained for consumer compatibility; not used by DCP mapper. */
  temsServiceBase?: string;
  temsOfferBase?: string;
  temsCategoryBase?: string;
  temsImageBase?: string;
  temsProviderBase?: string;
}
