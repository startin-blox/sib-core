import type * as JSONLDContextParser from 'jsonld-context-parser';
import type { CacheManagerInterface } from '../../cache/CacheManager.ts';
import { InMemoryCacheManager } from '../../cache/InMemory.ts';
import type { ServerPaginationOptions } from '../../shared/options/server-pagination.ts';
import type { ServerSearchOptions } from '../../shared/options/server-search.ts';
import type { IStore, Resource, StoreConfig } from '../../shared/types.ts';

import type {
  Asset,
  AssetAgreementMapping,
  AssetInput,
  CatalogRequest,
  CatalogResponse,
  ContractAgreement,
  ContractDefinition,
  ContractDefinitionInput,
  ContractNegotiationResponse,
  DataAddress,
  Dataset,
  DataspaceConnectorConfig,
  EDRDataAddress,
  EDRRequest,
  EDRResponse,
  OdrlPolicy,
  PolicyDefinition,
  PolicyDefinitionInput,
  TransferProcess,
  TransferRequest,
} from './types.ts';
import { AssetValidationError } from './types.ts';

export class DataspaceConnectorStore implements IStore<Resource> {
  cache: CacheManagerInterface;
  session: Promise<any> | undefined;
  headers?: object;

  private config: DataspaceConnectorConfig;
  private authToken: string | null = null;
  private contractNegotiations: Map<string, ContractNegotiationResponse> =
    new Map();
  private transferProcesses: Map<string, TransferProcess> = new Map();
  private contractAgreements: Map<string, ContractAgreement> = new Map();
  private assetAgreements: Map<string, AssetAgreementMapping> = new Map();
  private edrTokens: Map<string, EDRDataAddress> = new Map();

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

    // Set default endpoints if not provided
    if (!config.edrsEndpoint) {
      config.edrsEndpoint = config.catalogEndpoint.replace(
        '/catalog/request',
        '/edrs',
      );
    }
    if (!config.publicEndpoint) {
      // Try to derive from config endpoint
      if (config.endpoint) {
        const baseUrl = config.endpoint.replace('/management', '');
        config.publicEndpoint = `${baseUrl}/public`;
      }
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
    counterPartyId?: string,
  ): Promise<string> {
    await this.ensureAuthenticated();

    const negotiationRequest = {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
      },
      '@type': 'ContractRequest',
      counterPartyAddress,
      counterPartyId: counterPartyId,
      protocol: 'dataspace-protocol-http',
      policy: {
        '@context': 'http://www.w3.org/ns/odrl.jsonld',
        '@id': policy['@id'],
        '@type': 'Offer',
        assigner: counterPartyId || 'provider',
        target: policy.target,
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
      const errorText = await response.text();
      console.error(
        `Contract negotiation failed: ${response.status} ${response.statusText}`,
        errorText,
      );
      throw new Error(
        `Contract negotiation failed: ${response.status} ${response.statusText} - ${errorText}`,
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
    counterPartyId?: string,
  ): Promise<string> {
    return this.negotiateContract(
      counterPartyAddress,
      assetId,
      policy,
      counterPartyId,
    );
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
   * Get contract agreement after negotiation is finalized
   */
  async getContractAgreement(
    negotiationId: string,
  ): Promise<ContractAgreement | null> {
    await this.ensureAuthenticated();

    try {
      const response = await this.fetchAuthn(
        `${this.config.contractNegotiationEndpoint}/${negotiationId}/agreement`,
        {
          method: 'GET',
          headers: this.headers,
        },
      );

      if (!response.ok) {
        console.error(
          `Failed to get contract agreement: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const agreement: ContractAgreement = await response.json();

      // Store the agreement
      this.contractAgreements.set(agreement['@id'], agreement);

      // Update asset agreement mapping
      const assetId = agreement.assetId;
      if (assetId) {
        const existing = this.assetAgreements.get(assetId);
        const mapping: AssetAgreementMapping = {
          assetId,
          catalogId: existing?.catalogId,
          agreementId: agreement['@id'],
          agreement,
          negotiationId,
          transferId: existing?.transferId,
          edrToken: existing?.edrToken,
          createdAt: existing?.createdAt || Date.now(),
          lastUpdated: Date.now(),
        };
        this.assetAgreements.set(assetId, mapping);
      }

      return agreement;
    } catch (error) {
      console.error('Error retrieving contract agreement:', error);
      return null;
    }
  }

  /**
   * Get stored contract agreement for an asset
   */
  getStoredContractAgreement(assetId: string): ContractAgreement | null {
    const mapping = this.assetAgreements.get(assetId);
    return mapping?.agreement || null;
  }

  /**
   * Fetch all contract negotiations from the EDC connector
   */
  async getAllContractNegotiations(): Promise<any[]> {
    await this.ensureAuthenticated();

    try {
      // Try EDC v3 request endpoint format
      const requestEndpoint = `${this.config.contractNegotiationEndpoint}/request`;

      const response = await this.fetchAuthn(requestEndpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          '@context': {
            '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
          },
          '@type': 'QuerySpec',
          offset: 0,
          limit: 1000,
        }),
      });

      if (!response.ok) {
        const getResponse = await this.fetchAuthn(
          `${this.config.contractNegotiationEndpoint}?offset=0&limit=1000`,
          {
            method: 'GET',
            headers: this.headers,
          },
        );

        if (!getResponse.ok) {
          console.warn(
            `Failed to fetch contract negotiations: ${getResponse.status} ${getResponse.statusText}`,
          );
          return [];
        }

        const getData = await getResponse.json();
        return Array.isArray(getData) ? getData : getData.items || [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.items || [];
    } catch (error) {
      console.error('Error fetching contract negotiations:', error);
      return [];
    }
  }

  /**
   * Load existing agreements from EDC connector
   */
  async loadExistingAgreements(): Promise<void> {
    try {
      const negotiations = await this.getAllContractNegotiations();

      let _loadedCount = 0;
      for (const negotiation of negotiations) {
        // Only process finalized/agreed negotiations
        if (
          negotiation.state === 'FINALIZED' ||
          negotiation.state === 'AGREED'
        ) {
          try {
            const agreement = await this.getContractAgreement(
              negotiation['@id'],
            );
            if (agreement) {
              _loadedCount++;
            }
          } catch (error) {
            console.warn(
              `⚠️ Failed to load agreement for negotiation ${negotiation['@id']}:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing agreements:', error);
    }
  }

  /**
   * Get all stored asset-agreement mappings
   */
  getAllAssetAgreements(): AssetAgreementMapping[] {
    return Array.from(this.assetAgreements.values());
  }

  /**
   * Get existing agreement for a specific asset
   */
  getAssetAgreement(assetId: string): AssetAgreementMapping | null {
    return this.assetAgreements.get(assetId) || null;
  }

  /**
   * Check if there's an existing valid agreement for the given asset
   */
  hasValidAgreement(assetId: string): boolean {
    const agreement = this.getAssetAgreement(assetId);
    return agreement !== null;
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
   * Initiate EDR transfer request for HttpProxy data destination
   */
  async initiateEDRTransfer(
    assetId: string,
    counterPartyAddress: string,
    contractId: string,
  ): Promise<string> {
    await this.ensureAuthenticated();

    const edrRequest: EDRRequest = {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
      },
      '@type': 'https://w3id.org/edc/v0.0.1/ns/TransferRequest',
      assetId,
      protocol: 'dataspace-protocol-http',
      counterPartyAddress,
      contractId,
      transferType: 'HttpData-PULL',
      dataDestination: {
        type: 'HttpProxy',
      },
    };

    const response = await this.fetchAuthn(
      this.config.transferProcessEndpoint,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(edrRequest),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `EDR transfer initiation failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const edrResponse: EDRResponse = await response.json();
    const transferId = edrResponse['@id'];

    // Update asset agreement mapping with transfer ID
    const mapping = this.assetAgreements.get(assetId);
    if (mapping) {
      mapping.transferId = transferId;
      mapping.lastUpdated = Date.now();
      this.assetAgreements.set(assetId, mapping);
    }

    return transferId;
  }

  /**
   * Get EDR token using transfer process ID with polling
   */
  async getEDRToken(
    transferId: string,
    maxRetries = 10,
    retryDelay = 2000,
  ): Promise<EDRDataAddress | null> {
    await this.ensureAuthenticated();

    const edrsEndpoint =
      this.config.edrsEndpoint ||
      this.config.catalogEndpoint.replace('/catalog/request', '/edrs');

    const requestUrl = `${edrsEndpoint}/${transferId}/dataaddress`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchAuthn(requestUrl, {
          method: 'GET',
          headers: this.headers,
        });

        if (response.ok) {
          const edrDataAddress: EDRDataAddress = await response.json();

          // Store the EDR token
          this.edrTokens.set(transferId, edrDataAddress);

          // Update asset agreement mapping with EDR token
          const assetMapping = Array.from(this.assetAgreements.values()).find(
            mapping => mapping.transferId === transferId,
          );
          if (assetMapping) {
            assetMapping.edrToken = edrDataAddress.authorization;
            assetMapping.lastUpdated = Date.now();
          }

          return edrDataAddress;
        }

        const errorText = await response.text();
        let errorObj: any;
        try {
          errorObj = JSON.parse(errorText);
        } catch (_e) {
          errorObj = { message: errorText };
        }

        console.warn(
          `⚠️ EDR token attempt ${attempt}/${maxRetries} failed: ${response.status} ${response.statusText}`,
          errorObj,
        );

        // If this is a 404 (not found) and we have more retries, wait and try again
        if (response.status === 404 && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // For other errors or final attempt, throw error
        console.error(
          `❌ Final EDR token retrieval failed: ${response.status} ${response.statusText}`,
          errorObj,
        );
        console.error(`🔗 Request URL: ${requestUrl}`);
        console.error(`🆔 Transfer ID used: ${transferId}`);

        throw new Error(
          `EDR token retrieval failed: ${response.status} ${response.statusText} - ${errorObj.message || errorText}`,
        );
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.warn(
          `⚠️ EDR token attempt ${attempt}/${maxRetries} error:`,
          error,
        );
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    // Should not reach here
    throw new Error(
      `Failed to retrieve EDR token after ${maxRetries} attempts`,
    );
  }

  /**
   * Get stored EDR token for a transfer ID
   */
  getStoredEDRToken(transferId: string): EDRDataAddress | null {
    return this.edrTokens.get(transferId) || null;
  }

  /**
   * Fetch data using EDR token through the provider's public endpoint
   */
  async fetchWithEDRToken(
    edrDataAddress: EDRDataAddress,
    additionalPath?: string,
  ): Promise<any> {
    const { endpoint, authorization } = edrDataAddress;

    // Build the URL - if additionalPath is provided, append it to the endpoint
    const url = additionalPath ? `${endpoint}${additionalPath}` : endpoint;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authorization, // Use the JWT token directly (not Bearer prefix)
          Accept: 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(
          `EDR data fetch failed: ${response.status} ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching data with EDR token:', error);
      throw error;
    }
  }

  /**
   * Complete flow: negotiate -> agreement -> transfer -> EDR -> data access
   */
  async accessAssetData(
    assetId: string,
    counterPartyAddress: string,
    policy: OdrlPolicy,
    counterPartyId?: string,
    additionalPath?: string,
  ): Promise<any> {
    try {
      // Check if we already have an EDR token for this asset
      const existingMapping = this.assetAgreements.get(assetId);
      if (existingMapping?.edrToken && existingMapping.transferId) {
        const edrDataAddress = this.edrTokens.get(existingMapping.transferId);
        if (edrDataAddress) {
          return await this.fetchWithEDRToken(edrDataAddress, additionalPath);
        }
      }
      const negotiationId = await this.negotiateContract(
        counterPartyAddress,
        assetId,
        policy,
        counterPartyId,
      );
      // Note: In practice, the component should poll getNegotiationStatus()
      // until state is FINALIZED before proceeding

      return { negotiationId, status: 'negotiation_initiated' };
    } catch (error) {
      console.error('Error in complete asset access flow:', error);
      throw error;
    }
  }

  /**
   * Continue asset access flow after negotiation is finalized
   */
  async continueAssetAccess(
    negotiationId: string,
    assetId: string,
    counterPartyAddress: string,
    additionalPath?: string,
  ): Promise<any> {
    try {
      const agreement = await this.getContractAgreement(negotiationId);
      if (!agreement) {
        throw new Error('Failed to retrieve contract agreement');
      }
      const transferId = await this.initiateEDRTransfer(
        assetId,
        counterPartyAddress,
        agreement['@id'],
      );
      const edrDataAddress = await this.getEDRToken(transferId);
      if (!edrDataAddress) {
        throw new Error('Failed to retrieve EDR token');
      }
      const data = await this.fetchWithEDRToken(edrDataAddress, additionalPath);

      return data;
    } catch (error) {
      console.error('Error continuing asset access flow:', error);
      throw error;
    }
  }

  /**
   * Access asset data for an asset that already has stored agreement and EDR token
   */
  async accessStoredAssetData(
    assetId: string,
    additionalPath?: string,
  ): Promise<any> {
    const mapping = this.assetAgreements.get(assetId);
    if (!mapping?.transferId) {
      throw new Error(`No stored transfer information for asset: ${assetId}`);
    }

    const edrDataAddress = this.edrTokens.get(mapping.transferId);
    if (!edrDataAddress) {
      throw new Error(`No stored EDR token for asset: ${assetId}`);
    }

    return await this.fetchWithEDRToken(edrDataAddress, additionalPath);
  }

  /**
   * Complete dataspace flow: catalog -> negotiate -> transfer -> fetch
   */
  private async fetchThroughDataspace(
    resourceId: string,
  ): Promise<Resource | null> {
    try {
      // 1. Get catalog to find dataset
      const catalog = await this.getCatalog();
      if (!catalog) {
        console.error('No catalog available');
        return null;
      }

      // 2. Find dataset in catalog
      const dataset = this.findDatasetInCatalog(catalog, resourceId);
      if (!dataset) {
        console.error(`Dataset ${resourceId} not found in catalog`);
        return null;
      }

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

  // =================== ASSETS MANAGEMENT METHODS ===================

  /**
   * Get all assets (alias for existing method)
   */
  async getAllAssets(querySpec?: any): Promise<Asset[]> {
    return this.getAssets(querySpec);
  }

  /**
   * Get single asset by ID
   */
  async getAsset(assetId: string): Promise<Asset | null> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const assetsEndpoint =
      this.config.assetsEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/assets' : '/assets',
      );

    const response = await this.fetchAuthn(`${assetsEndpoint}/${assetId}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(
        `Failed to get asset: ${response.status} ${response.statusText}`,
      );
    }

    const asset: Asset = await response.json();

    // Cache the asset (cast to Resource for compatibility)
    if (asset['@id']) {
      await this.cache.set(asset['@id'], asset as Resource);
    }

    return asset;
  }

  /**
   * Create new asset
   */
  async createAsset(assetInput: AssetInput): Promise<Asset> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const assetsEndpoint =
      this.config.assetsEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/assets' : '/assets',
      );

    const assetData = {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
        edc: 'https://w3id.org/edc/v0.0.1/ns/',
      },
      '@type': 'Asset',
      '@id': assetInput['@id'],
      properties: assetInput.properties || {},
      dataAddress: assetInput.dataAddress,
    };

    const response = await this.fetchAuthn(assetsEndpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(assetData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create asset: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // EDC usually returns the created asset or just success
    let createdAsset: Asset;
    try {
      createdAsset = await response.json();
    } catch {
      // If no response body, construct asset from input
      createdAsset = {
        '@type': 'Asset',
        '@id': assetInput['@id'],
        properties: assetInput.properties,
        dataAddress: assetInput.dataAddress,
        createdAt: Date.now(),
      };
    }

    // Cache the created asset (cast to Resource for compatibility)
    if (createdAsset['@id']) {
      await this.cache.set(createdAsset['@id'], createdAsset as Resource);
    }

    return createdAsset;
  }

  /**
   * Update existing asset
   * Uses DELETE + POST pattern since PUT is not working with EDC v3 API
   * Prevents updates if the asset has active contract agreements or negotiations
   */
  async updateAsset(assetId: string, assetInput: AssetInput): Promise<Asset> {
    await this.ensureAuthenticated();

    // Check if asset has any agreements or negotiations
    const hasAgreement = this.hasValidAgreement(assetId);
    if (hasAgreement) {
      const message =
        `Cannot update asset ${assetId}: Asset has active contract agreements. ` +
        `Deleting an asset with agreements would invalidate existing contracts. ` +
        `Please terminate or complete all negotiations first.`;
      throw new AssetValidationError(message, assetId, 'update', 'agreements');
    }

    // Check if asset is involved in any negotiations
    const negotiations = await this.getAllContractNegotiations();
    const activeNegotiations = negotiations.filter(
      neg =>
        neg.state !== 'FINALIZED' &&
        neg.state !== 'TERMINATED' &&
        neg.assetId === assetId,
    );

    if (activeNegotiations.length > 0) {
      const message =
        `Cannot update asset ${assetId}: Asset has ${activeNegotiations.length} active contract negotiation(s). ` +
        `Please wait for negotiations to complete or terminate them first.`;
      throw new AssetValidationError(
        message,
        assetId,
        'update',
        'negotiations',
        {
          negotiationCount: activeNegotiations.length,
          negotiations: activeNegotiations,
        },
      );
    }

    console.log(`⚠️  Using DELETE + POST pattern to update asset ${assetId}`);

    // Step 1: Delete the existing asset (skip agreement check since we already checked above)
    try {
      const deleted = await this.deleteAsset(assetId, true);
      if (!deleted) {
        throw new Error(
          `Failed to delete existing asset ${assetId} for update`,
        );
      }
    } catch (deleteError) {
      // If deleteAsset throws AssetValidationError (from 409), convert it to update operation
      if (deleteError instanceof AssetValidationError) {
        throw new AssetValidationError(
          deleteError.message.replace('Cannot delete', 'Cannot update'),
          assetId,
          'update',
          deleteError.reason,
          deleteError.details,
        );
      }
      throw deleteError;
    }

    // Step 2: Create the asset with new data
    try {
      const updatedAsset = await this.createAsset(assetInput);
      console.log(`✅ Asset ${assetId} updated successfully via DELETE + POST`);
      return updatedAsset;
    } catch (createError) {
      // If creation fails after deletion, we're in a bad state
      console.error(
        `❌ Critical: Failed to recreate asset ${assetId} after deletion`,
        createError,
      );
      const errorMessage =
        createError instanceof Error
          ? createError.message
          : String(createError);
      throw new Error(
        `Failed to recreate asset after deletion: ${errorMessage}. ` +
          `Asset ${assetId} has been deleted but not recreated.`,
      );
    }
  }

  /**
   * Delete asset
   * Prevents deletion if the asset has active contract agreements or negotiations
   */
  async deleteAsset(
    assetId: string,
    skipAgreementCheck = false,
  ): Promise<boolean> {
    await this.ensureAuthenticated();

    // Skip agreement check only when called internally from updateAsset
    if (!skipAgreementCheck) {
      // Check if asset has any agreements or negotiations
      const hasAgreement = this.hasValidAgreement(assetId);
      if (hasAgreement) {
        const message =
          `Cannot delete asset ${assetId}: Asset has active contract agreements. ` +
          `Deleting an asset with agreements would invalidate existing contracts. ` +
          `Please terminate or complete all negotiations first.`;
        throw new AssetValidationError(
          message,
          assetId,
          'delete',
          'agreements',
        );
      }

      // Check if asset is involved in any negotiations
      const negotiations = await this.getAllContractNegotiations();
      const activeNegotiations = negotiations.filter(
        neg =>
          neg.state !== 'FINALIZED' &&
          neg.state !== 'TERMINATED' &&
          neg.assetId === assetId,
      );

      if (activeNegotiations.length > 0) {
        const message =
          `Cannot delete asset ${assetId}: Asset has ${activeNegotiations.length} active contract negotiation(s). ` +
          `Please wait for negotiations to complete or terminate them first.`;
        throw new AssetValidationError(
          message,
          assetId,
          'delete',
          'negotiations',
          {
            negotiationCount: activeNegotiations.length,
            negotiations: activeNegotiations,
          },
        );
      }
    }

    const apiVersion = this.config.apiVersion || 'v3';
    const assetsEndpoint =
      this.config.assetsEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/assets' : '/assets',
      );

    const response = await this.fetchAuthn(`${assetsEndpoint}/${assetId}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Handle 409 Conflict - Asset has active agreements
      if (response.status === 409) {
        try {
          const errorDetails = JSON.parse(errorText);
          // EDC returns array of error objects: [{"message":"...", "type":"ObjectConflict", ...}]
          const errorMessage =
            Array.isArray(errorDetails) && errorDetails.length > 0
              ? errorDetails[0].message
              : errorText;

          const message = `Cannot delete asset ${assetId}: ${errorMessage}`;
          throw new AssetValidationError(
            message,
            assetId,
            'delete',
            'agreements',
            { apiResponse: errorDetails },
          );
        } catch (parseError) {
          // If JSON parsing fails, throw AssetValidationError with raw text
          if (parseError instanceof AssetValidationError) {
            throw parseError; // Re-throw if it's already our custom error
          }
          const message = `Cannot delete asset ${assetId}: ${errorText}`;
          throw new AssetValidationError(
            message,
            assetId,
            'delete',
            'agreements',
            { rawError: errorText },
          );
        }
      }

      // For other errors, throw generic error
      throw new Error(
        `Failed to delete asset: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // Remove from cache
    await this.cache.delete(assetId);

    // Remove asset agreement mappings
    this.assetAgreements.delete(assetId);

    return true;
  }

  // =================== POLICIES MANAGEMENT METHODS ===================

  /**
   * Get all policy definitions (alias for existing method)
   */
  async getAllPolicies(querySpec?: any): Promise<PolicyDefinition[]> {
    return this.getPolicyDefinitions(querySpec);
  }

  /**
   * Get single policy definition by ID
   */
  async getPolicy(policyId: string): Promise<PolicyDefinition | null> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const policiesEndpoint =
      this.config.policiesEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/policydefinitions' : '/policydefinitions',
      );

    const response = await this.fetchAuthn(`${policiesEndpoint}/${policyId}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(
        `Failed to get policy: ${response.status} ${response.statusText}`,
      );
    }

    const policy: PolicyDefinition = await response.json();

    // Cache the policy (cast to Resource for compatibility)
    if (policy['@id']) {
      await this.cache.set(policy['@id'], policy as Resource);
    }

    return policy;
  }

  /**
   * Create new policy definition
   */
  async createPolicy(
    policyInput: PolicyDefinitionInput,
  ): Promise<PolicyDefinition> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const policiesEndpoint =
      this.config.policiesEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/policydefinitions' : '/policydefinitions',
      );

    const policyData = {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
        edc: 'https://w3id.org/edc/v0.0.1/ns/',
        odrl: 'http://www.w3.org/ns/odrl/2/',
      },
      '@type': 'PolicyDefinition',
      '@id': policyInput['@id'],
      policy: policyInput.policy,
    };

    const response = await this.fetchAuthn(policiesEndpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(policyData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create policy: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // Construct created policy
    const createdPolicy: PolicyDefinition = {
      '@type': 'PolicyDefinition',
      '@id': policyInput['@id'],
      policy: policyInput.policy,
      createdAt: Date.now(),
    };

    // Cache the created policy (cast to Resource for compatibility)
    if (createdPolicy['@id']) {
      await this.cache.set(createdPolicy['@id'], createdPolicy as Resource);
    }

    return createdPolicy;
  }

  /**
   * Update existing policy definition
   */
  async updatePolicy(
    policyId: string,
    policyInput: PolicyDefinitionInput,
  ): Promise<PolicyDefinition> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const policiesEndpoint =
      this.config.policiesEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/policydefinitions' : '/policydefinitions',
      );

    const policyData = {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
        edc: 'https://w3id.org/edc/v0.0.1/ns/',
        odrl: 'http://www.w3.org/ns/odrl/2/',
      },
      '@type': 'PolicyDefinition',
      '@id': policyInput['@id'],
      policy: policyInput.policy,
    };

    const response = await this.fetchAuthn(`${policiesEndpoint}/${policyId}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(policyData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to update policy: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // Construct updated policy
    const updatedPolicy: PolicyDefinition = {
      '@type': 'PolicyDefinition',
      '@id': policyInput['@id'],
      policy: policyInput.policy,
      createdAt: Date.now(),
    };

    // Update cache (cast to Resource for compatibility)
    await this.cache.set(policyId, updatedPolicy as Resource);

    return updatedPolicy;
  }

  /**
   * Delete policy definition
   */
  async deletePolicy(policyId: string): Promise<boolean> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const policiesEndpoint =
      this.config.policiesEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/policydefinitions' : '/policydefinitions',
      );

    const response = await this.fetchAuthn(`${policiesEndpoint}/${policyId}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete policy: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // Remove from cache
    await this.cache.delete(policyId);

    return true;
  }

  // =================== CONTRACT DEFINITIONS MANAGEMENT METHODS ===================

  /**
   * Get all contract definitions (alias for existing method)
   */
  async getAllContractDefinitions(
    querySpec?: any,
  ): Promise<ContractDefinition[]> {
    return this.getContractDefinitions(querySpec);
  }

  /**
   * Get single contract definition by ID
   */
  async getContractDefinition(
    contractId: string,
  ): Promise<ContractDefinition | null> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const contractDefsEndpoint =
      this.config.contractDefinitionsEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/contractdefinitions' : '/contractdefinitions',
      );

    const response = await this.fetchAuthn(
      `${contractDefsEndpoint}/${contractId}`,
      {
        method: 'GET',
        headers: this.headers,
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(
        `Failed to get contract definition: ${response.status} ${response.statusText}`,
      );
    }

    const contract: ContractDefinition = await response.json();

    // Cache the contract definition (cast to Resource for compatibility)
    if (contract['@id']) {
      await this.cache.set(contract['@id'], contract as Resource);
    }

    return contract;
  }

  /**
   * Create new contract definition
   */
  async createContractDefinition(
    contractInput: ContractDefinitionInput,
  ): Promise<ContractDefinition> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const contractDefsEndpoint =
      this.config.contractDefinitionsEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/contractdefinitions' : '/contractdefinitions',
      );

    const contractData = {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
        edc: 'https://w3id.org/edc/v0.0.1/ns/',
      },
      '@type': 'ContractDefinition',
      '@id': contractInput['@id'],
      accessPolicyId: contractInput.accessPolicyId,
      contractPolicyId: contractInput.contractPolicyId,
      assetsSelector: contractInput.assetsSelector || [],
    };

    const response = await this.fetchAuthn(contractDefsEndpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(contractData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create contract definition: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // Construct created contract definition
    const createdContract: ContractDefinition = {
      '@type': 'ContractDefinition',
      '@id': contractInput['@id'],
      accessPolicyId: contractInput.accessPolicyId,
      contractPolicyId: contractInput.contractPolicyId,
      assetsSelector: contractInput.assetsSelector,
      createdAt: Date.now(),
    };

    // Cache the created contract definition (cast to Resource for compatibility)
    if (createdContract['@id']) {
      await this.cache.set(createdContract['@id'], createdContract as Resource);
    }

    return createdContract;
  }

  /**
   * Update existing contract definition
   */
  async updateContractDefinition(
    contractId: string,
    contractInput: ContractDefinitionInput,
  ): Promise<ContractDefinition> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const contractDefsEndpoint =
      this.config.contractDefinitionsEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/contractdefinitions' : '/contractdefinitions',
      );

    const contractData = {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
        edc: 'https://w3id.org/edc/v0.0.1/ns/',
      },
      '@type': 'ContractDefinition',
      '@id': contractInput['@id'],
      accessPolicyId: contractInput.accessPolicyId,
      contractPolicyId: contractInput.contractPolicyId,
      assetsSelector: contractInput.assetsSelector || [],
    };

    const response = await this.fetchAuthn(
      `${contractDefsEndpoint}/${contractId}`,
      {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(contractData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to update contract definition: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // Construct updated contract definition
    const updatedContract: ContractDefinition = {
      '@type': 'ContractDefinition',
      '@id': contractInput['@id'],
      accessPolicyId: contractInput.accessPolicyId,
      contractPolicyId: contractInput.contractPolicyId,
      assetsSelector: contractInput.assetsSelector,
      createdAt: Date.now(),
    };

    // Update cache (cast to Resource for compatibility)
    await this.cache.set(contractId, updatedContract as Resource);

    return updatedContract;
  }

  /**
   * Delete contract definition
   */
  async deleteContractDefinition(contractId: string): Promise<boolean> {
    await this.ensureAuthenticated();

    const apiVersion = this.config.apiVersion || 'v3';
    const contractDefsEndpoint =
      this.config.contractDefinitionsEndpoint ||
      this.config.catalogEndpoint.replace(
        '/catalog/request',
        apiVersion === 'v3' ? '/contractdefinitions' : '/contractdefinitions',
      );

    const response = await this.fetchAuthn(
      `${contractDefsEndpoint}/${contractId}`,
      {
        method: 'DELETE',
        headers: this.headers,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete contract definition: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // Remove from cache
    await this.cache.delete(contractId);

    return true;
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
