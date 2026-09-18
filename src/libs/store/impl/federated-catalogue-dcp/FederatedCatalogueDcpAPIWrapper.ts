import type { DcpCatalogQueryResponse } from './interfaces.ts';

// Thin DCP FC client for POST /v1alpha/catalog/query. `apiKey` becomes an
// `x-api-key` header — required when the FC runs WEB_HTTP_CATALOG_AUTH_TYPE=tokenbased.
export interface GetAggregatedCatalogOptions {
  flatten?: boolean;
}

export interface FederatedCatalogueDcpAPIWrapperOptions {
  apiKey?: string;
}

export class FederatedCatalogueDcpAPIWrapper {
  private baseUrl: string;
  private fetchImpl: typeof fetch;
  private apiKey?: string;

  constructor(
    baseUrl: string,
    fetchImpl: typeof fetch = fetch.bind(globalThis),
    options: FederatedCatalogueDcpAPIWrapperOptions = {},
  ) {
    // Strip any trailing slash so path concatenation is deterministic.
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.fetchImpl = fetchImpl;
    this.apiKey = options.apiKey || undefined;
  }

  async getAggregatedCatalog(
    opts: GetAggregatedCatalogOptions = {},
  ): Promise<DcpCatalogQueryResponse> {
    const { flatten = true } = opts;
    const url = `${this.baseUrl}/v1alpha/catalog/query${flatten ? '?flatten=true' : ''}`;
    const body = JSON.stringify({
      '@context': { edc: 'https://w3id.org/edc/v0.0.1/ns/' },
      '@type': 'QuerySpec',
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.apiKey) headers['x-api-key'] = this.apiKey;
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers,
      body,
    });
    if (!response.ok) {
      throw new Error(
        `[FederatedCatalogueDcpAPIWrapper] POST /v1alpha/catalog/query failed: ${response.status} ${response.statusText}`,
        { cause: response },
      );
    }
    const payload = (await response.json()) as unknown;
    // Endpoint returns either a bare array (crawler-aggregated) or an object
    // whose top-level keys enumerate catalogs — normalize to an array.
    if (Array.isArray(payload)) return payload as DcpCatalogQueryResponse;
    if (payload && typeof payload === 'object') {
      const values = Object.values(payload as Record<string, unknown>);
      return values.filter(
        v => typeof v === 'object' && v !== null && '@type' in (v as object),
      ) as DcpCatalogQueryResponse;
    }
    return [];
  }
}
