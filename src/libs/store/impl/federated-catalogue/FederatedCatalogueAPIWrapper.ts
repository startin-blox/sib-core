/*based on https://github.com/balessan/federated-api/blob/main/src/get.py */

import type { SelfDescription } from './SelfDescription.d.ts';

export interface KeycloakOptions
  extends KeycloakOptionsServer,
    KeycloakOptionsLogins {}

export interface KeycloakOptionsServer {
  kc_url: string;
  kc_grant_type: string;
  kc_scope: string;
}

export interface KeycloakOptionsLogins {
  kc_url: string;
  kc_grant_type: string;
  kc_client_id: string;
  kc_client_secret: string;
  kc_username: string;
  kc_password: string;
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
  connect: (() => Promise<string>) | null;
  constructor(options: KeycloakOptions, fcBaseUrl: string) {
    this.fcBaseUrl = fcBaseUrl;
    try {
      const connection = this.firstConnect(options);
      this.connect = () => connection;
    } catch (e) {
      console.log('Error while establishing the first connection', e);
      this.connect = null;
    }
  }

  private async firstConnect(options: KeycloakOptions) {
    const body = new URLSearchParams({
      grant_type: options.kc_grant_type,
      client_id: options.kc_client_id,
      client_secret: options.kc_client_secret,
      scope: options.kc_scope,
      username: options.kc_username,
      password: options.kc_password,
    });
    const headers = new Headers({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const response = await fetch(options.kc_url, {
      method: 'POST',
      headers,
      body,
    });
    const data = await response.json();
    const token = data.access_token;
    if (token == null) {
      throw new Error('connexion fails', { cause: data });
    }
    return token;
  }

  async getAllSelfDescriptions() {
    if (!this.connect) return null;
    const token = await this.connect();

    const url = `${this.fcBaseUrl}/self-descriptions`;
    const headers = new Headers({ Authorization: `Bearer ${token}` });

    const response = await fetch(url, { headers });
    return (await response.json()) as SelfDescriptions;
  }

  async getSelfDescriptionByHash(sdHash: string) {
    if (!this.connect) return null;
    const token = await this.connect();

    const url = `${this.fcBaseUrl}/self-descriptions/${sdHash}`;
    const headers = new Headers({ Authorization: `Bearer ${token}` });
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok)
      throw new Error(
        `GET /self-descriptions/${sdHash} failed: ${response.status} ${response.statusText}`,
        { cause: response },
      );

    return (await response.json()) as SelfDescription;
  }

  async postQuery(statement: string, parameters: Record<string, any> = {}) {
    if (!this.connect) return null;
    const token = await this.connect();

    const url = `${this.fcBaseUrl}/query`;
    const headers = new Headers({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    const body = JSON.stringify({
      statement,
      parameters,
    });
    const response = await fetch(url, {
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
    if (!this.connect) return null;
    const token = await this.connect();

    const url = `${this.fcBaseUrl}/query/search`;
    const headers = new Headers({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    const body = JSON.stringify({
      statement,
      parameters,
      annotations: annotations || { queryLanguage },
    });

    const response = await fetch(url, {
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
