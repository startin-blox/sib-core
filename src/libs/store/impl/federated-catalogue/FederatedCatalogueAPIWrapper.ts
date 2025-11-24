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

interface TokenState {
  access_token: string;
  refresh_token: string | null;
  expires_at: number; // timestamp in milliseconds
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
  private loginOptions: KeycloakLoginOptions;
  private tokenState: TokenState | null = null;
  private tokenRefreshBuffer = 5 * 60 * 1000; // Refresh 5 minutes before expiration
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  connect: (() => Promise<string>) | null;

  constructor(options: KeycloakLoginOptions, fcBaseUrl: string) {
    this.fcBaseUrl = fcBaseUrl;
    this.loginOptions = options;
    try {
      const connection = this.firstConnect(options);
      this.connect = () => connection;
    } catch (e) {
      console.log('Error while establishing the first connection', e);
      this.connect = null;
    }
  }

  private async firstConnect(options: KeycloakLoginOptions) {
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

    // Store token metadata for refresh mechanism
    this.tokenState = {
      access_token: token,
      refresh_token: data.refresh_token || null,
      expires_at: Date.now() + ((data.expires_in || 3600) * 1000),
    };

    return token;
  }

  /**
   * Refreshes the access token using the refresh token
   * Falls back to password grant if refresh token is not available
   */
  private async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performRefresh();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async _performRefresh(): Promise<string> {
    // If no refresh token available, re-authenticate with credentials
    if (!this.tokenState?.refresh_token) {
      console.log('No refresh token available, re-authenticating with credentials');
      return this.firstConnect(this.loginOptions);
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.loginOptions.kc_client_id,
        client_secret: this.loginOptions.kc_client_secret,
        refresh_token: this.tokenState.refresh_token,
      });

      const headers = new Headers({
        'Content-Type': 'application/x-www-form-urlencoded',
      });

      const response = await fetch(this.loginOptions.kc_url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        console.warn('Token refresh failed, re-authenticating with credentials');
        return this.firstConnect(this.loginOptions);
      }

      const data = await response.json();
      const token = data.access_token;

      if (token == null) {
        throw new Error('Token refresh failed: no access_token in response', {
          cause: data,
        });
      }

      // Update token state with new tokens
      this.tokenState = {
        access_token: token,
        refresh_token: data.refresh_token || this.tokenState.refresh_token,
        expires_at: Date.now() + ((data.expires_in || 3600) * 1000),
      };

      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Fall back to password grant
      return this.firstConnect(this.loginOptions);
    }
  }

  /**
   * Gets a valid token, refreshing if necessary
   * Implements proactive token refresh before expiration
   */
  private async getValidToken(): Promise<string> {
    // If no token state, do initial authentication
    if (!this.tokenState) {
      return this.firstConnect(this.loginOptions);
    }

    // Check if token is expired or will expire soon
    const now = Date.now();
    const isExpiringSoon = now >= this.tokenState.expires_at - this.tokenRefreshBuffer;

    if (isExpiringSoon) {
      return this.refreshToken();
    }

    return this.tokenState.access_token;
  }

  /**
   * Wrapper for fetch with automatic token refresh on 401/403 errors
   * Implements both proactive (before expiration) and reactive (on error) token refresh
   */
  private async fetchWithAuth(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    // Get a valid token (proactive refresh if needed)
    const token = await this.getValidToken();

    // Add Authorization header
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);

    // Make the request
    let response = await fetch(url, { ...options, headers });

    // If authentication failed, try refreshing token and retry once
    if (response.status === 401 || response.status === 403) {
      console.log(
        `Authentication failed (${response.status}), refreshing token and retrying...`,
      );

      try {
        // Force token refresh
        const newToken = await this.refreshToken();

        // Retry request with new token
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
          console.error(
            'Authentication still failed after token refresh. Please check credentials.',
          );
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Return the original failed response
      }
    }

    return response;
  }

  async getAllSelfDescriptions() {
    if (!this.connect) return null;

    const url = `${this.fcBaseUrl}/self-descriptions`;
    const response = await this.fetchWithAuth(url);

    return (await response.json()) as SelfDescriptions;
  }

  async getSelfDescriptionByHash(sdHash: string) {
    if (!this.connect) return null;

    const url = `${this.fcBaseUrl}/self-descriptions/${sdHash}`;
    const response = await this.fetchWithAuth(url, { method: 'GET' });

    if (!response.ok)
      throw new Error(
        `GET /self-descriptions/${sdHash} failed: ${response.status} ${response.statusText}`,
        { cause: response },
      );

    return (await response.json()) as SelfDescription;
  }

  async postQuery(statement: string, parameters: Record<string, any> = {}) {
    if (!this.connect) return null;

    const url = `${this.fcBaseUrl}/query`;
    const body = JSON.stringify({
      statement,
      parameters,
    });
    const response = await this.fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const url = `${this.fcBaseUrl}/query/search`;
    const body = JSON.stringify({
      statement,
      parameters,
      annotations: annotations || { queryLanguage },
    });

    const response = await this.fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
