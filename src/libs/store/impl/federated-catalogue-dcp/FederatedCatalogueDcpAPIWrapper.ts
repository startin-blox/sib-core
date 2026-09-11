import type { DcpCatalogQueryResponse } from './interfaces.ts';

/**
 * Thin client for the DCP-flavored EDC Federated Catalog extension.
 *
 * Only one endpoint is used by the store today:
 *   POST /v1alpha/catalog/query
 * with the JSON-LD framing prescribed by the upstream spec.
 *
 * The DCP FC's read API is unauthenticated by default. If the consumer has an
 * OIDC/bearer token (e.g. from `sib-auth`), we attach it via the injected
 * `fetch` function so future gated deployments work without a code change.
 */
export interface GetAggregatedCatalogOptions {
  /**
   * `flatten=true` (default) asks the FC to normalize nested `dcat:catalog`
   * sub-entries into a single-level `dcat:dataset` list per source catalog.
   * The response is still one catalog per source participant.
   */
  flatten?: boolean;
}

export class FederatedCatalogueDcpAPIWrapper {
  private baseUrl: string;
  private fetchImpl: typeof fetch;

  constructor(
    baseUrl: string,
    fetchImpl: typeof fetch = fetch.bind(globalThis),
  ) {
    // Strip any trailing slash so path concatenation is deterministic.
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.fetchImpl = fetchImpl;
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
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
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
