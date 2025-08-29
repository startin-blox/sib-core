import type * as JSONLDContextParser from 'jsonld-context-parser';
import type { Resource } from '../../../mixins/interfaces.ts';
import type { IStore, StoreConfig } from '../IStore.ts';
import type { CacheManagerInterface } from '../cache/cache-manager.ts';
import { InMemoryCacheManager } from '../cache/in-memory.ts';
import type { ServerPaginationOptions } from '../options/server-pagination.ts';
import type { ServerSearchOptions } from '../options/server-search.ts';

import type {
  CatalogRequest,
  CatalogResponse,
  ContractNegotiationResponse,
  DataAddress,
  Dataset,
  DataspaceConnectorConfig,
  OdrlPolicy,
  TransferProcess,
  TransferRequest,
} from './types.ts';

export class DataspaceConnectorStore implements IStore<Resource> {
  cache: CacheManagerInterface;
  session: Promise<any> | undefined;
  headers?: object;

  private config: DataspaceConnectorConfig;
  private authToken: string | null = null;
  private contractNegotiations: Map<string, ContractNegotiationResponse> =
    new Map();
  private transferProcesses: Map<string, TransferProcess> = new Map();

  constructor(config: DataspaceConnectorConfig) {
    this.validateConfig(config);
    this.config = config;
    this.cache = config.options?.cacheManager ?? new InMemoryCacheManager();
    this.session = config.options?.session;
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private validateConfig(config: DataspaceConnectorConfig): void {
    const required = [
      'catalogEndpoint',
      'contractNegotiationEndpoint',
      'transferProcessEndpoint',
      'authMethod',
    ];
    const missing = required.filter(field => !config[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }

  // Core IStore interface implementation
  async getData(args: any): Promise<Resource | null> {
    if ('targetType' in args) {
      return (await this.getCatalog(args.targetType)) as Resource | null;
    }
    return await this.get(args.id, args.serverPagination, args.serverSearch);
  }

  async get(
    id: string,
    _serverPagination?: ServerPaginationOptions,
    _serverSearch?: ServerSearchOptions,
  ): Promise<Resource | null> {
    // Check cache first
    const cached = await this.cache.get(id);
    if (cached) return cached;

    try {
      // Attempt to fetch through contract negotiation + transfer
      const resource = await this.fetchThroughDataspace(id);
      if (resource) {
        await this.cacheResource(id, resource);
      }
      return resource;
    } catch (error) {
      console.error(`Failed to fetch resource ${id}:`, error);
      return null;
    }
  }

  // Dataspace Protocol specific methods

  /**
   * Request catalog from dataspace participant (v3 compatible)
   */
  async getCatalog(
    counterPartyAddress?: string,
  ): Promise<CatalogResponse | null> {
    await this.ensureAuthenticated();

    const catalogRequest: CatalogRequest =
      this.buildV3CatalogRequest(counterPartyAddress);
    console.log(
      'Sending v3 catalog request:',
      JSON.stringify(catalogRequest, null, 2),
    );

    const response = await this.fetchAuthn(this.config.catalogEndpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(catalogRequest),
    });

    if (!response.ok) {
      console.error(
        `Catalog request failed: ${response.status} ${response.statusText}`,
      );
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }

    const catalog = await response.json();

    // Cache the catalog itself
    if (catalog['@id']) {
      await this.cache.set(catalog['@id'], catalog);
    }

    // Cache each dataset by its ID for individual retrieval
    if (catalog['dcat:dataset'] && Array.isArray(catalog['dcat:dataset'])) {
      for (const dataset of catalog['dcat:dataset']) {
        if (dataset['@id']) {
          await this.cache.set(dataset['@id'], dataset);
        }
      }
    }

    return catalog;
  }

  /**
   * Negotiate contract for dataset access
   */
  async negotiateContract(
    counterPartyAddress: string,
    _offerId: string,
    policy: OdrlPolicy,
  ): Promise<string> {
    await this.ensureAuthenticated();

    const negotiationRequest = {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
      },
      '@type': 'ContractRequest',
      counterPartyAddress,
      protocol: 'dataspace-protocol-http',
      policy: {
        '@context': 'http://www.w3.org/ns/odrl.jsonld',
        '@id': policy['@id'],
        '@type': 'Offer',
        assigner: 'provider',
        target: policy.target || 'assetId',
      },
    };

    const response = await this.fetchAuthn(
      this.config.contractNegotiationEndpoint,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(negotiationRequest),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Contract negotiation failed: ${response.status} ${response.statusText}`,
      );
    }

    const negotiation: ContractNegotiationResponse = await response.json();
    const negotiationId = negotiation['@id'];

    // Store negotiation for tracking
    this.contractNegotiations.set(negotiationId, negotiation);

    // Return negotiation ID immediately - let caller handle polling
    return negotiationId;
  }

  /**
   * Alias for negotiateContract - for backwards compatibility
   */
  initiateNegotiation(
    counterPartyAddress: string,
    assetId: string,
    policy: OdrlPolicy,
  ): Promise<string> {
    return this.negotiateContract(counterPartyAddress, assetId, policy);
  }

  /**
   * Get negotiation status by ID - public method for component access
   */
  getNegotiationStatus(
    negotiationId: string,
  ): Promise<ContractNegotiationResponse> {
    return this._getNegotiationStatus(negotiationId);
  }

  /**
   * Initiate transfer process for contracted dataset
   */
  async initiateTransfer(
    counterPartyAddress: string,
    contractId: string,
    dataDestination: DataAddress,
  ): Promise<string> {
    await this.ensureAuthenticated();

    const transferRequest: TransferRequest = {
      '@context': [
        'https://w3id.org/edc/v0.0.1/ns/',
        'https://w3id.org/dspace/2024/1/context.json',
      ],
      '@type': 'https://w3id.org/edc/v0.0.1/ns/TransferRequestMessage',
      counterPartyAddress,
      contractId,
      dataDestination,
    };

    const response = await this.fetchAuthn(
      this.config.transferProcessEndpoint,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(transferRequest),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Transfer initiation failed: ${response.status} ${response.statusText}`,
      );
    }

    const transfer: TransferProcess = await response.json();
    const transferId = transfer['@id'];

    // Store transfer for tracking
    this.transferProcesses.set(transferId, transfer);

    return transferId;
  }

  /**
   * Complete dataspace flow: catalog -> negotiate -> transfer -> fetch
   */
  private async fetchThroughDataspace(
    resourceId: string,
  ): Promise<Resource | null> {
    try {
      console.log(`Fetching resource through dataspace: ${resourceId}`);

      // 1. Get catalog to find dataset
      const catalog = await this.getCatalog();
      if (!catalog) {
        console.error('No catalog available');
        return null;
      }

      console.log('Catalog received:', catalog);

      // 2. Find dataset in catalog
      const dataset = this.findDatasetInCatalog(catalog, resourceId);
      if (!dataset) {
        console.error(`Dataset ${resourceId} not found in catalog`);
        return null;
      }

      console.log('Dataset found:', dataset);

      // For demo purposes, return the catalog as a mock resource
      // In a real implementation, you would continue with contract negotiation
      return catalog as any;
    } catch (error) {
      console.error('Dataspace fetch failed:', error);
      return null;
    }
  }

  private findDatasetInCatalog(
    catalog: CatalogResponse,
    resourceId: string,
  ): Dataset | null {
    const datasets = catalog['dcat:dataset'] || [];
    return (
      datasets.find(
        (dataset: Dataset) =>
          dataset['@id'] === resourceId ||
          dataset['dcat:distribution']?.some(
            (dist: any) => dist['@id'] === resourceId,
          ),
      ) || null
    );
  }

  // Remove this method since component now handles all polling
  /*private async _waitForNegotiationCompletion(
    negotiationId: string,
  ): Promise<string> {
    const maxAttempts = this.config.retryAttempts || 30;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this._getNegotiationStatus(negotiationId);

      if (status.state === 'FINALIZED') {
        return status.contractAgreementId || negotiationId;
      }
      if (status.state === 'TERMINATED') {
        throw new Error(
          `Contract negotiation terminated: ${status.errorDetail}`,
        );
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Contract negotiation timeout');
  }*/

  private async _getNegotiationStatus(
    negotiationId: string,
  ): Promise<ContractNegotiationResponse> {
    const response = await this.fetchAuthn(
      `${this.config.contractNegotiationEndpoint}/${negotiationId}`,
      { method: 'GET', headers: this.headers },
    );
    return response.json();
  }

  // Authentication management
  private async ensureAuthenticated(): Promise<void> {
    if (this.authToken && this.headers) return;

    switch (this.config.authMethod) {
      case 'edc-api-key':
        if (!this.config.edcApiKey) {
          throw new Error(
            'EDC API key required but not provided. Set edcApiKey in configuration.',
          );
        }
        this.authToken = this.config.edcApiKey;
        this.headers = {
          ...this.headers,
          'X-Api-Key': this.authToken,
        };
        break;

      case 'bearer':
        if (!this.config.bearerToken) {
          throw new Error('Bearer token required but not provided');
        }
        this.authToken = this.config.bearerToken;
        this.headers = {
          ...this.headers,
          Authorization: `Bearer ${this.authToken}`,
        };
        break;

      case 'oauth2':
        this.authToken = await this.getOAuth2Token();
        this.headers = {
          ...this.headers,
          Authorization: `Bearer ${this.authToken}`,
        };
        break;

      case 'delegated':
        if (!this.config.delegatedAuthConfig) {
          throw new Error('Delegated auth config required but not provided');
        }
        this.authToken = await this.getDelegatedAuthToken();
        this.headers = {
          ...this.headers,
          Authorization: `Bearer ${this.authToken}`,
        };
        break;
    }
  }

  private async getOAuth2Token(): Promise<string> {
    if (!this.config.oauth2Config) {
      throw new Error('OAuth2 config required');
    }

    const { tokenEndpoint, clientId, clientSecret, scope } =
      this.config.oauth2Config;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    if (scope) {
      body.append('scope', scope);
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new Error(`OAuth2 token request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  private async getDelegatedAuthToken(): Promise<string> {
    if (!this.config.delegatedAuthConfig) {
      throw new Error('Delegated auth config required');
    }

    const { identityProviderEndpoint, clientId, clientSecret } =
      this.config.delegatedAuthConfig;

    if (!clientId || !clientSecret) {
      throw new Error(
        'Client ID and secret required for delegated authentication',
      );
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(identityProviderEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Delegated auth token request failed: ${response.status}`,
      );
    }

    const data = await response.json();
    return data.access_token;
  }

  private buildV3CatalogRequest(counterPartyAddress?: string): CatalogRequest {
    const apiVersion = this.config.apiVersion || 'v3';

    if (apiVersion === 'v3') {
      return {
        '@context': {
          '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
          edc: 'https://w3id.org/edc/v0.0.1/ns/',
          dcat: 'https://www.w3.org/ns/dcat#',
          dct: 'https://purl.org/dc/terms/',
          odrl: 'http://www.w3.org/ns/odrl/2/',
        },
        '@type': 'CatalogRequestMessage',
        counterPartyAddress: counterPartyAddress || this.getProtocolEndpoint(),
        protocol: 'dataspace-protocol-http',
      } as any;
    }
    // v2 format (legacy)
    return {
      '@context': [
        'https://w3id.org/edc/v0.0.1/ns/',
        'https://w3id.org/dspace/2024/1/context.json',
      ],
      '@type': 'https://w3id.org/edc/v0.0.1/ns/CatalogRequestMessage',
      counterPartyAddress: counterPartyAddress || this.config.endpoint || '',
      protocol: 'dataspace-protocol-http',
    };
  }

  private getProtocolEndpoint(): string {
    // Try to derive protocol endpoint from config
    if (this.config.endpoint) {
      const baseUrl = this.config.endpoint.replace('/management', '');
      return `${baseUrl}/protocol`;
    }
    return this.config.endpoint || '';
  }

  /**
   * Get assets list (v3 compatible - uses POST with QuerySpec)
   */
  async getAssets(querySpec?: any): Promise<any[]> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const assetsEndpoint =
      this.config.assetsEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/assets/request' : '/assets',
      );

    const requestBody = querySpec || this.buildV3QuerySpec();

    const method = apiVersion === 'v3' ? 'POST' : 'GET';
    const requestOptions: any = {
      method,
      headers: this.headers,
    };

    if (method === 'POST') {
      requestOptions.body = JSON.stringify(requestBody);
    }

    const response = await this.fetchAuthn(assetsEndpoint, requestOptions);

    if (!response.ok) {
      console.error(
        `Assets request failed: ${response.status} ${response.statusText}`,
      );
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return [];
    }

    const assets = await response.json();
    const assetsArray = Array.isArray(assets) ? assets : [];

    // Cache each asset by its ID for individual retrieval
    for (const asset of assetsArray) {
      if (asset['@id']) {
        await this.cache.set(asset['@id'], asset);
      }
    }

    return assetsArray;
  }

  /**
   * Get policy definitions (v3 compatible - uses POST with QuerySpec)
   */
  async getPolicyDefinitions(querySpec?: any): Promise<any[]> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const policiesEndpoint =
      this.config.policiesEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3'
          ? '/policydefinitions/request'
          : '/policydefinitions',
      );

    const requestBody = querySpec || this.buildV3QuerySpec();

    const method = apiVersion === 'v3' ? 'POST' : 'GET';
    const requestOptions: any = {
      method,
      headers: this.headers,
    };

    if (method === 'POST') {
      requestOptions.body = JSON.stringify(requestBody);
    }

    const response = await this.fetchAuthn(policiesEndpoint, requestOptions);

    if (!response.ok) {
      console.error(
        `Policy definitions request failed: ${response.status} ${response.statusText}`,
      );
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return [];
    }

    const policies = await response.json();
    const policiesArray = Array.isArray(policies) ? policies : [];

    // Cache each policy by its ID for individual retrieval
    for (const policy of policiesArray) {
      if (policy['@id']) {
        await this.cache.set(policy['@id'], policy);
      }
    }

    return policiesArray;
  }

  /**
   * Get contract definitions (v3 compatible - uses POST with QuerySpec)
   */
  async getContractDefinitions(querySpec?: any): Promise<any[]> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const contractDefsEndpoint =
      this.config.contractDefinitionsEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3'
          ? '/contractdefinitions/request'
          : '/contractdefinitions',
      );

    const requestBody = querySpec || this.buildV3QuerySpec();

    const method = apiVersion === 'v3' ? 'POST' : 'GET';
    const requestOptions: any = {
      method,
      headers: this.headers,
    };

    if (method === 'POST') {
      requestOptions.body = JSON.stringify(requestBody);
    }

    const response = await this.fetchAuthn(
      contractDefsEndpoint,
      requestOptions,
    );

    if (!response.ok) {
      console.error(
        `Contract definitions request failed: ${response.status} ${response.statusText}`,
      );
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return [];
    }

    const contracts = await response.json();
    const contractsArray = Array.isArray(contracts) ? contracts : [];

    // Cache each contract definition by its ID for individual retrieval
    for (const contract of contractsArray) {
      if (contract['@id']) {
        await this.cache.set(contract['@id'], contract);
      }
    }

    return contractsArray;
  }

  /**
   * Build standard v3 QuerySpec for list requests
   */
  private buildV3QuerySpec(offset = 0, limit = 50): any {
    return {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
        edc: 'https://w3id.org/edc/v0.0.1/ns/',
      },
      '@type': 'QuerySpec',
      offset,
      limit,
      filterExpression: [],
      sortField: null,
      sortOrder: 'ASC',
    };
  }

  async fetchAuthn(iri: string, options: any): Promise<Response> {
    await this.ensureAuthenticated();
    return fetch(iri, {
      ...options,
      headers: { ...this.headers, ...options.headers },
      mode: 'cors',
    });
  }

  // Standard IStore methods (simplified implementations)
  async post(
    _resource: object,
    _id: string,
    _skipFetch?: boolean,
  ): Promise<string | null> {
    await Promise.resolve();
    throw new Error('POST not implemented for DataspaceConnectorStore');
  }

  async put(
    _resource: object,
    _id: string,
    _skipFetch?: boolean,
  ): Promise<string | null> {
    await Promise.resolve();
    throw new Error('PUT not implemented for DataspaceConnectorStore');
  }

  async patch(
    _resource: object,
    _id: string,
    _skipFetch?: boolean,
  ): Promise<string | null> {
    await Promise.resolve();
    throw new Error('PATCH not implemented for DataspaceConnectorStore');
  }

  delete(
    _id: string,
    _context?: JSONLDContextParser.JsonLdContextNormalized | null,
  ): any {
    throw new Error('DELETE not implemented for DataspaceConnectorStore');
  }

  async clearCache(id: string): Promise<void> {
    await this.cache.delete(id);
  }

  async cacheResource(key: string, resourceProxy: any): Promise<void> {
    await this.cache.set(key, resourceProxy);
  }

  _getLanguage(): string {
    return localStorage.getItem('language') || 'en';
  }

  selectLanguage(selectedLanguageCode: string): void {
    localStorage.setItem('language', selectedLanguageCode);
  }

  subscribeResourceTo(_resourceId: string, _nestedResourceId: string): void {
    // Not applicable for dataspace connector
  }

  getExpandedPredicate(
    property: string,
    _context: JSONLDContextParser.JsonLdContextNormalized | null,
  ): string | null {
    // Simplified implementation - would need full JSON-LD context processing
    return property;
  }
}

// Adapter for factory registration
export class DataspaceConnectorStoreAdapter {
  private static store: IStore<any>;

  private constructor() {}

  public static getStoreInstance(cfg?: StoreConfig): IStore<any> {
    if (!DataspaceConnectorStoreAdapter.store) {
      if (!cfg) {
        throw new Error('DataspaceConnectorStore configuration is required');
      }
      DataspaceConnectorStoreAdapter.store = new DataspaceConnectorStore(
        cfg as DataspaceConnectorConfig,
      );
    }
    return DataspaceConnectorStoreAdapter.store;
  }
}
