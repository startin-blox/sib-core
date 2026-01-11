/*based on https://github.com/balessan/federated-api/blob/main/src/get.py */

import type { SelfDescription } from './SelfDescription.d.ts';

export interface KeycloakLoginOptions {
  kc_url: string;
  kc_grant_type: string;
  kc_client_id: string;
  kc_client_secret: string;
  kc_username: string;
  kc_password: string;
  kc_scope: string;
}

export interface SelfDescriptions {
  totalCount: number;
  items: SelfDescriptionsItem[];
}

export interface SelfDescriptionsItem {
  meta: SelfDescriptionsMeta;
  content: unknown;
}

export interface SelfDescriptionsMeta {
  expirationTime: string;
  content: unknown;
  validators: string[];
  sdHash: string;
  id: string;
  status: string;
  issuer: string;
  validatorDids: string[];
  uploadDatetime: string;
  statusDatetime: string;
}

export class FederatedCatalogueAPIWrapper {
  private fcBaseUrl: string;
  private fetch: (
    input: RequestInfo,
    init?: RequestInit | undefined,
  ) => Promise<Response>;

  constructor(
    fcBaseUrl: string,
    fetchAuth?: (
      input: RequestInfo,
      init?: RequestInit | undefined,
    ) => Promise<Response>,
  ) {
    this.fcBaseUrl = fcBaseUrl;
    const baseFetch = fetchAuth || fetch;
    // Ensure fetch is called with the correct global context (avoids "Illegal invocation" in tests)
    this.fetch = baseFetch.bind(globalThis);
  }

  async getAllSelfDescriptions() {
    const url = `${this.fcBaseUrl}/self-descriptions`;
    const response = await this.fetch(url);
    return (await response.json()) as SelfDescriptions;
  }

  async getSelfDescriptionByHash(sdHash: string) {
    const url = `${this.fcBaseUrl}/self-descriptions/${sdHash}`;
    const response = await this.fetch(url, {
      method: 'GET',
    });

    if (!response.ok)
      throw new Error(
        `GET /self-descriptions/${sdHash} failed: ${response.status} ${response.statusText}`,
        { cause: response },
      );

    return (await response.json()) as SelfDescription;
  }

  async postQuery(statement: string, parameters: Record<string, any> = {}) {
    const url = `${this.fcBaseUrl}/query`;
    const headers = new Headers({
      'Content-Type': 'application/json',
    });
    const body = JSON.stringify({
      statement,
      parameters,
    });
    const response = await this.fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(
        `[ERROR] POST /query failed: ${response.status} ${response.statusText}`,
        { cause: response },
      );
    }

    return await response.json();
  }

  async postQuerySearch(
    statement: string,
    parameters: Record<string, any> = {},
    queryLanguage = 'OPENCYPHER',
    annotations?: Record<string, any>,
  ): Promise<any | null> {
    const url = `${this.fcBaseUrl}/query/search`;
    const headers = new Headers({
      'Content-Type': 'application/json',
    });
    const body = JSON.stringify({
      statement,
      parameters,
      annotations: annotations || { queryLanguage },
    });

    const response = await this.fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(
        `[ERROR] POST /query/search failed: ${response.status} ${response.statusText}`,
        { cause: response },
      );
    }

    return await response.json();
  }
}
