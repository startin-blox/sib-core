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

interface TokenState {
  access_token: string;
  refresh_token: string | null;
  expires_at: number; // timestamp in milliseconds
}

export class FederatedCatalogueAPIWrapper {
  private fcBaseUrl: string;
  private loginOptions: KeycloakLoginOptions;
  private tokenState: TokenState | null = null;
  private tokenRefreshBuffer = 5 * 60 * 1000; // Refresh 5 minutes before expiration
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  private readonly STORAGE_KEY = 'fc_token_state';

  // Custom fetch function (authenticated fetch from Solid or global fetch)
  private _fetch: (
    input: RequestInfo | URL,
    init?: RequestInit | undefined,
  ) => Promise<Response>;

  // Whether to use Keycloak authentication (false when using external authenticated fetch)
  private useKeycloakAuth: boolean;

  constructor(
    options: KeycloakLoginOptions,
    fcBaseUrl: string,
    fetchAuth?: (
      input: RequestInfo | URL,
      init?: RequestInit | undefined,
    ) => Promise<Response>,
  ) {
    this.fcBaseUrl = fcBaseUrl;
    this.loginOptions = options;

    // If fetchAuth is provided and no login options, use the authenticated fetch directly
    // Otherwise, use global fetch with Keycloak token management
    if (fetchAuth && (!options.kc_url || options.kc_url === '')) {
      this._fetch = fetchAuth;
      this.useKeycloakAuth = false;
    } else {
      // Ensure fetch is called with the correct global context (avoids "Illegal invocation" in tests)
      this._fetch = fetch.bind(globalThis);
      this.useKeycloakAuth = true;
      // Try to load existing token state from localStorage
      this.loadTokenState();
    }

    // Only attempt Keycloak connection if using Keycloak auth
    if (this.useKeycloakAuth) {
      try {
        this.firstConnect(options);
      } catch (e) {
        console.log('Error while establishing the first connection', e);
      }
    }
  }

  /**
   * Save token state to localStorage for persistence across page reloads
   */
  private saveTokenState(): void {
    if (this.tokenState) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tokenState));
        console.log(
          '💾 [FederatedCatalogueAPIWrapper] Token state saved to localStorage',
        );
      } catch (error) {
        console.error('Failed to save token state to localStorage:', error);
      }
    }
  }

  /**
   * Load token state from localStorage
   */
  private loadTokenState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.tokenState = JSON.parse(stored);
        console.log(
          '📂 [FederatedCatalogueAPIWrapper] Token state loaded from localStorage:',
          {
            hasAccessToken: !!this.tokenState?.access_token,
            hasRefreshToken: !!this.tokenState?.refresh_token,
            expiresAt: this.tokenState?.expires_at,
            isExpired: this.tokenState
              ? Date.now() >= this.tokenState.expires_at
              : 'N/A',
          },
        );
      }
    } catch (error) {
      console.error('Failed to load token state from localStorage:', error);
      this.clearTokenState();
    }
  }

  /**
   * Clear token state from memory and localStorage
   */
  private clearTokenState(): void {
    this.tokenState = null;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ [FederatedCatalogueAPIWrapper] Token state cleared');
    } catch (error) {
      console.error('Failed to clear token state from localStorage:', error);
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
    const response = await this._fetch(options.kc_url, {
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
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    };

    // Persist to localStorage
    this.saveTokenState();

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
      console.log(
        'No refresh token available, re-authenticating with credentials',
      );
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

      const response = await this._fetch(this.loginOptions.kc_url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        console.warn(
          'Token refresh failed, re-authenticating with credentials',
        );
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
        expires_at: Date.now() + (data.expires_in || 3600) * 1000,
      };

      // Persist to localStorage
      this.saveTokenState();

      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear invalid token state
      this.clearTokenState();
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
      return await this.firstConnect(this.loginOptions);
    }

    // Check if token is expired or will expire soon
    const now = Date.now();
    const isExpiringSoon =
      now >= this.tokenState.expires_at - this.tokenRefreshBuffer;

    if (isExpiringSoon) {
      return await this.refreshToken();
    }

    return this.tokenState.access_token;
  }

  /**
   * Wrapper for fetch with automatic token refresh on 401/403 errors
   * Implements both proactive (before expiration) and reactive (on error) token refresh
   * If useKeycloakAuth is false, uses the authenticated fetch directly without token management
   */
  private async fetchWithAuth(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    // If not using Keycloak auth, use the authenticated fetch directly
    if (!this.useKeycloakAuth) {
      return this._fetch(url, options);
    }

    // Get a valid token (proactive refresh if needed)
    const token = await this.getValidToken();

    // Add Authorization header
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);

    // Make the request using the configured fetch
    let response = await this._fetch(url, { ...options, headers });

    // If authentication failed, try refreshing token and retry once
    if (response.status === 401 || response.status === 403) {
      console.log(
        `🔐 [FederatedCatalogueAPIWrapper] Authentication failed (${response.status}) for ${url}`,
      );
      console.log(
        '🔄 [FederatedCatalogueAPIWrapper] Attempting token refresh...',
        {
          hasRefreshToken: !!this.tokenState?.refresh_token,
          tokenExpired: this.tokenState
            ? Date.now() >= this.tokenState.expires_at
            : 'N/A',
        },
      );

      try {
        // Force token refresh
        const newToken = await this.refreshToken();
        console.log(
          '✅ [FederatedCatalogueAPIWrapper] Token refreshed successfully, retrying request...',
        );

        // Retry request with new token
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await this._fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
          console.error(
            `❌ [FederatedCatalogueAPIWrapper] Authentication still failed after token refresh (${response.status}). Please check credentials.`,
          );
        } else {
          console.log(
            `✅ [FederatedCatalogueAPIWrapper] Retry succeeded with status ${response.status}`,
          );
        }
      } catch (error) {
        console.error(
          '❌ [FederatedCatalogueAPIWrapper] Failed to refresh token:',
          error,
        );
        // Return the original failed response
      }
    }

    return response;
  }

  async getAllSelfDescriptions() {
    const url = `${this.fcBaseUrl}/self-descriptions`;
    // const response = await this.fetch(url);
    const response = await this.fetchWithAuth(url);
    return (await response.json()) as SelfDescriptions;
  }

  async getSelfDescriptionByHash(sdHash: string) {
    const url = `${this.fcBaseUrl}/self-descriptions/${sdHash}`;

    const response = await this.fetchWithAuth(url, { method: 'GET' });
    // const response = await this.fetch(url, {
    //   method: 'GET',
    // });

    if (!response.ok)
      throw new Error(
        `GET /self-descriptions/${sdHash} failed: ${response.status} ${response.statusText}`,
        { cause: response },
      );

    return (await response.json()) as SelfDescription;
  }

  async postQuery(statement: string, parameters: Record<string, any> = {}) {
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
