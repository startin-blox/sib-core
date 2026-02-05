import { UserManager, WebStorageStateStore, User } from 'oidc-client-ts';
import type { LocalKeycloakConfig } from '../impl/dataspace-connector/types.ts';

/**
 * Manages silent OIDC authentication with a local participant Keycloak.
 * Uses iframe-based silent auth to acquire user-specific tokens,
 * leveraging the user's existing SSO session.
 *
 * This provides user-auditable tokens (tied to the logged-in user)
 * instead of service account tokens from client_credentials grant.
 */
export class LocalKeycloakAuthManager {
  private userManager: UserManager | null = null;
  private localUser: User | null = null;
  private config: LocalKeycloakConfig;
  private initPromise: Promise<void> | null = null;

  constructor(config: LocalKeycloakConfig) {
    this.config = config;
  }

  /**
   * Initialize the OIDC UserManager.
   * Called lazily on first token request.
   */
  async initialize(): Promise<void> {
    if (this.userManager) {
      return;
    }

    // Prevent multiple concurrent initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    // Use configured silentRedirectUri or default to same origin
    const silentRedirectUri = this.config.silentRedirectUri || `${window.location.origin}/silent-callback.html`;

    console.log('[LocalKeycloakAuth] Initializing with config:', {
      authority: this.config.authority,
      clientId: this.config.clientId,
      scope: this.config.scope || 'openid profile',
      silentRedirectUri,
    });

    this.userManager = new UserManager({
      authority: this.config.authority,
      client_id: this.config.clientId,
      redirect_uri: silentRedirectUri,
      silent_redirect_uri: silentRedirectUri,
      response_type: 'code',
      scope: this.config.scope || 'openid profile',
      automaticSilentRenew: true,
      // Use localStorage with a distinct prefix to avoid collisions
      // with the main governance OIDC session
      userStore: new WebStorageStateStore({
        store: window.localStorage,
        prefix: 'local_kc.',
      }),
      // PKCE is enabled by default in oidc-client-ts for public clients
    });

    // Set up event handlers for token refresh
    this.userManager.events.addUserLoaded((user) => {
      console.log('[LocalKeycloakAuth] User loaded/refreshed:', user.profile?.sub);
      this.localUser = user;
    });

    this.userManager.events.addSilentRenewError((error) => {
      console.warn('[LocalKeycloakAuth] Silent renew error:', error);
      this.localUser = null;
    });

    this.userManager.events.addUserSignedOut(() => {
      console.log('[LocalKeycloakAuth] User signed out');
      this.localUser = null;
    });

    // Try to load existing user from storage
    try {
      const existingUser = await this.userManager.getUser();
      if (existingUser && !existingUser.expired) {
        this.localUser = existingUser;
        console.log('[LocalKeycloakAuth] Loaded existing user from storage:', existingUser.profile?.sub);
      }
    } catch (error) {
      console.debug('[LocalKeycloakAuth] No existing user in storage');
    }
  }

  /**
   * Get an access token for the local Keycloak.
   * Uses silent iframe-based auth if no valid token is cached.
   *
   * @returns The access token, or null if silent auth fails
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.userManager) {
      await this.initialize();
    }

    // Check if we have a valid cached token (with 60s buffer before expiry)
    if (this.localUser && !this.isTokenExpiringSoon()) {
      console.debug('[LocalKeycloakAuth] Using cached token for user:', this.localUser.profile?.sub);
      return this.localUser.access_token;
    }

    // Try silent sign-in via iframe
    try {
      console.log('[LocalKeycloakAuth] Attempting silent sign-in...');
      this.localUser = await this.userManager!.signinSilent();

      if (this.localUser) {
        console.log('[LocalKeycloakAuth] Silent auth successful for user:', this.localUser.profile?.sub);
        return this.localUser.access_token;
      }

      console.warn('[LocalKeycloakAuth] Silent auth returned no user');
      return null;
    } catch (error: any) {
      // Common reasons for failure:
      // - login_required: No active session in local Keycloak (third-party cookies blocked)
      // - invalid_client: Client not configured as public in Keycloak
      // - iframe blocked by browser/CSP
      // - Keycloak session expired
      console.warn('[LocalKeycloakAuth] Silent auth failed:', error);
      return null;
    }
  }

  /**
   * Check if the current token is valid (not expired or expiring soon).
   */
  isTokenValid(): boolean {
    return !!this.localUser && !this.isTokenExpiringSoon();
  }

  /**
   * Check if the token is expiring within 60 seconds.
   */
  private isTokenExpiringSoon(): boolean {
    if (!this.localUser) {
      return true;
    }

    // expires_at is in seconds since epoch
    const expiresAt = this.localUser.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const bufferSeconds = 60;

    return expiresAt - now < bufferSeconds;
  }

  /**
   * Get the current user's profile if authenticated.
   */
  getUserProfile(): any | null {
    return this.localUser?.profile || null;
  }

  /**
   * Get the current user's subject (sub claim) if authenticated.
   */
  getUserSubject(): string | null {
    return this.localUser?.profile?.sub || null;
  }

  /**
   * Clear the local session and cached user.
   */
  async clearSession(): Promise<void> {
    this.localUser = null;
    if (this.userManager) {
      try {
        await this.userManager.removeUser();
      } catch (error) {
        console.warn('[LocalKeycloakAuth] Error clearing session:', error);
      }
    }
  }

  /**
   * Clean up resources (event listeners, etc.)
   */
  dispose(): void {
    if (this.userManager) {
      this.userManager.events.removeUserLoaded(() => {});
      this.userManager.events.removeSilentRenewError(() => {});
      this.userManager.events.removeUserSignedOut(() => {});
    }
    this.localUser = null;
    this.userManager = null;
    this.initPromise = null;
  }
}
