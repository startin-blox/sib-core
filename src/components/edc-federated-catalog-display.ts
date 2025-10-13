import { html, render } from 'lit';
import { Sib } from '../libs/Sib.ts';
import {
  type ProviderInfo,
  ProviderRegistry,
} from '../libs/provider-registry/ProviderRegistry.ts';
import { StoreFactory } from '../libs/store/StoreFactory.ts';
import type {
  FederatedDataset,
  Provider,
  ProviderStatus,
} from '../libs/store/impl/dataspace-connector/interfaces.ts';
import type { DataspaceConnectorConfig } from '../libs/store/impl/dataspace-connector/types.ts';
import { StoreType } from '../libs/store/shared/types.ts';
import { AttributeBinderMixin } from '../mixins/attributeBinderMixin.ts';
import { WidgetMixin } from '../mixins/widgetMixin.ts';

export const EdcFederatedCatalogDisplay = {
  name: 'edc-federated-catalog-display',
  use: [WidgetMixin, AttributeBinderMixin],
  attributes: {
    consumerConnector: {
      type: String,
      default: null,
      callback: function (value: string) {
        if (value && this.apiKey && this.providers?.length > 0) {
          this.fetchFederatedCatalog();
        }
      },
    },
    apiKey: {
      type: String,
      default: null,
      callback: function (value: string) {
        if (value && this.consumerConnector && this.providers?.length > 0) {
          this.fetchFederatedCatalog();
        }
      },
    },
    providers: {
      type: String,
      default: null,
      callback: function (value: string) {
        try {
          this._providersArray = value ? JSON.parse(value) : [];
          this.initializeProviderRegistry(); // Initialize registry when providers are set
          if (
            this._providersArray?.length > 0 &&
            this.consumerConnector &&
            this.apiKey
          ) {
            this.fetchFederatedCatalog();
          }
        } catch (error) {
          console.error('Failed to parse providers JSON:', error);
          this._providersArray = [];
        }
      },
    },
    defaultWidget: {
      type: String,
      default: 'edc-federated-dataset-item',
    },
    showProviderFilter: {
      type: Boolean,
      default: true,
    },
    showStats: {
      type: Boolean,
      default: true,
    },
  },
  initialState: {
    catalogs: new Map(),
    federatedDatasets: [],
    loading: false,
    error: null,
    negotiations: new Map(),
    stores: new Map(),
    _providersArray: [],
    providerStats: new Map(),
    selectedProviders: new Set(),
    searchQuery: '',
    loadingProviders: new Set(),
    errorProviders: new Map(),
    providerRegistry: null,
  },
  created() {
    // Registry will be initialized when providers are parsed
    if (
      this.consumerConnector &&
      this.apiKey &&
      this._providersArray?.length > 0
    ) {
      this.fetchFederatedCatalog();
    }
  },

  initializeProviderRegistry() {
    if (!this._providersArray || this._providersArray.length === 0) {
      return;
    }

    // Convert providers array to registry format
    const providerInfos: ProviderInfo[] = this._providersArray.map(
      (provider: Provider) => ({
        name: provider.name,
        protocolAddress: provider.address,
        participantId: provider.participantId || '', // Will be discovered from catalog
        description: `${provider.name} EDC Provider`,
        status: 'unknown' as const,
      }),
    );

    this.providerRegistry = new ProviderRegistry(providerInfos);
  },

  async fetchFederatedCatalog() {
    if (
      !this.consumerConnector ||
      !this.apiKey ||
      this._providersArray?.length === 0
    )
      return;

    this.loading = true;
    this.error = null;
    this.catalogs.clear();
    this.federatedDatasets = [];
    this.providerStats.clear();
    this.loadingProviders.clear();
    this.errorProviders.clear();
    this.selectedProviders.clear();

    // Initially select all providers
    for (const provider of this._providersArray) {
      this.selectedProviders.add(provider.address);
    }

    this.render();

    const config: DataspaceConnectorConfig = {
      type: StoreType.DataspaceConnector,
      endpoint: this.consumerConnector,
      catalogEndpoint: `${this.consumerConnector}/v3/catalog/request`,
      contractNegotiationEndpoint: `${this.consumerConnector}/v3/contractnegotiations`,
      transferProcessEndpoint: `${this.consumerConnector}/v3/transferprocesses`,
      edrsEndpoint: `${this.consumerConnector}/v3/edrs`,
      authMethod: 'edc-api-key',
      edcApiKey: this.apiKey,
      retryAttempts: 8,
      timeout: 30000,
    };

    const store = StoreFactory.create(config);

    // Fetch catalogs from all providers in parallel
    const catalogPromises = this._providersArray.map(
      async (provider: Provider) => {
        this.loadingProviders.add(provider.address);
        this.render();

        try {
          const catalog = await (store as any).getCatalog(provider.address);

          if (catalog) {
            this.catalogs.set(provider.address, { catalog, provider });
            // Ensure datasets is always an array (API returns single object when only one dataset)
            const datasetsRaw = catalog['dcat:dataset'] || [];
            const datasets = Array.isArray(datasetsRaw)
              ? datasetsRaw
              : [datasetsRaw];

            // Update provider registry with discovered participant ID
            if (catalog.participantId && this.providerRegistry) {
              const registryProvider =
                this.providerRegistry.getProviderByAddress(provider.address);
              if (registryProvider) {
                registryProvider.participantId = catalog.participantId;
                registryProvider.status = 'online';
                registryProvider.lastSeen = new Date().toISOString();
              }
            }

            // Track provider stats
            this.providerStats.set(provider.address, {
              provider,
              datasetCount: datasets.length,
              status: 'success',
              lastUpdated: new Date().toISOString(),
            });

            // Add datasets to federated list with provider info
            const federatedDatasets: FederatedDataset[] = datasets.map(
              (dataset: any) => ({
                dataset,
                provider,
                catalogId: catalog['@id'],
                participantId: catalog.participantId,
              }),
            );

            return federatedDatasets;
          }
          this.errorProviders.set(provider.address, 'No catalog received');
          this.providerStats.set(provider.address, {
            provider,
            datasetCount: 0,
            status: 'error',
            error: 'No catalog received',
            lastUpdated: new Date().toISOString(),
          });
          return [];
        } catch (error) {
          const errorMessage = (error as Error).message;
          console.error(
            `Failed to fetch catalog from ${provider.name}:`,
            error,
          );
          this.errorProviders.set(provider.address, errorMessage);
          this.providerStats.set(provider.address, {
            provider,
            datasetCount: 0,
            status: 'error',
            error: errorMessage,
            lastUpdated: new Date().toISOString(),
          });
          return [];
        } finally {
          this.loadingProviders.delete(provider.address);
        }
      },
    );

    try {
      const allFederatedDatasets = await Promise.all(catalogPromises);

      // Flatten and deduplicate datasets
      this.federatedDatasets = this.deduplicateDatasets(
        allFederatedDatasets.flat(),
      );

      // Store the store instance for later use in negotiations
      this.stores.set('default', store);
      await (store as any).loadExistingAgreements();
      this.render(); // Re-render to show existing agreement buttons
    } catch (error) {
      console.error('Failed to fetch federated catalog:', error);
      this.error = (error as Error).message;
    } finally {
      this.loading = false;
      this.render();
    }
  },

  deduplicateDatasets(datasets: FederatedDataset[]): FederatedDataset[] {
    const seen = new Map();
    const deduplicated: FederatedDataset[] = [];

    for (const item of datasets) {
      const datasetId = item.dataset['@id'];
      const participantId =
        item.participantId ||
        item.provider.participantId ||
        item.provider.address;
      // Use composite key: participantId + datasetId to allow same asset from different providers
      const key = `${participantId}:${datasetId}`;

      if (!seen.has(key)) {
        seen.set(key, item);
        deduplicated.push(item);
      } else {
        // If we've seen this exact dataset from this exact provider before,
        // prefer the one with more complete data
        const existing = seen.get(key);
        const currentPolicies =
          this.getPoliciesFromDataset(item.dataset).length || 0;
        const existingPolicies =
          this.getPoliciesFromDataset(existing.dataset).length || 0;

        if (currentPolicies > existingPolicies) {
          // Replace with better version and update in deduplicated array
          const index = deduplicated.findIndex(d => {
            const dParticipantId =
              d.participantId || d.provider.participantId || d.provider.address;
            return (
              dParticipantId === participantId && d.dataset['@id'] === datasetId
            );
          });
          if (index !== -1) {
            deduplicated[index] = item;
          }
          seen.set(key, item);
        }
      }
    }

    return deduplicated;
  },

  getFilteredDatasets(): FederatedDataset[] {
    let filtered = this.federatedDatasets;

    // Filter by selected providers
    // Always filter by selected providers - if none selected, show none
    filtered = filtered.filter(item =>
      this.selectedProviders.has(item.provider.address),
    );

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const dataset = item.dataset;
        const title = (
          dataset['dcterms:title'] ||
          dataset.properties?.name ||
          dataset['@id']
        ).toLowerCase();
        const description = (
          dataset['dcterms:description'] ||
          dataset.properties?.description ||
          ''
        ).toLowerCase();
        const keywords = (dataset['dcat:keyword'] || [])
          .join(' ')
          .toLowerCase();
        const providername = item.provider.name.toLowerCase();

        const matches =
          title.includes(query) ||
          description.includes(query) ||
          keywords.includes(query) ||
          providername.includes(query) ||
          dataset['@id'].toLowerCase().includes(query);
        return matches;
      });
    }

    return filtered;
  },

  // Helper method to extract policies from dataset
  getPoliciesFromDataset(dataset: any): any[] {
    const policies: any[] = [];

    // Check for policies directly on the dataset (standard EDC approach)
    if (dataset['odrl:hasPolicy']) {
      const datasetPolicies = Array.isArray(dataset['odrl:hasPolicy'])
        ? dataset['odrl:hasPolicy']
        : [dataset['odrl:hasPolicy']];
      policies.push(...datasetPolicies);
    }

    // Fallback: check distributions for policies (some EDC implementations might use this)
    if (policies.length === 0 && dataset['dcat:distribution']) {
      const distributionsRaw = dataset['dcat:distribution'] || [];
      const distributions = Array.isArray(distributionsRaw)
        ? distributionsRaw
        : distributionsRaw
          ? [distributionsRaw]
          : [];

      for (const distribution of distributions) {
        if (distribution['odrl:hasPolicy']) {
          const distributionPolicies = Array.isArray(
            distribution['odrl:hasPolicy'],
          )
            ? distribution['odrl:hasPolicy']
            : [distribution['odrl:hasPolicy']];
          policies.push(...distributionPolicies);
        }
      }
    }

    return policies;
  },

  async negotiateAccess(federatedDataset: FederatedDataset) {
    const { dataset, provider } = federatedDataset;
    const assetId = dataset['@id'];
    const negotiationKey = `${assetId}@${provider.address}`;

    // Get store instance
    const store = this.stores.get('default');
    if (!store) {
      console.error('Store not available for negotiation');
      return;
    }
    const existingAgreement = (store as any).getAssetAgreement(assetId);

    if (existingAgreement) {
      // Set the negotiation state to granted with existing agreement
      this.negotiations.set(negotiationKey, {
        status: 'granted',
        contractId: existingAgreement.agreementId,
        agreement: existingAgreement.agreement,
        provider,
        assetId,
        offerId: existingAgreement.agreement?.policy?.['@id'] || 'existing',
        // Include transfer info if available
        transferId: existingAgreement.transferId,
        edrToken: existingAgreement.edrToken,
      });
      this.render();
      return;
    }

    // Get policies using the helper method (supports both direct and distribution-based policies)
    const policies = this.getPoliciesFromDataset(dataset);
    if (policies.length === 0) {
      console.error('No policies available for dataset:', dataset['@id']);
      return;
    }

    try {
      // Use the first available policy for negotiation
      const policyDefinition = policies[0];

      if (!policyDefinition) {
        throw new Error('No valid policy found for negotiation');
      }

      const offerId = policyDefinition['@id'];

      // Create negotiation key that includes provider
      this.negotiations.set(negotiationKey, {
        status: 'negotiating',
        offerId,
        provider,
        assetId,
      });
      this.render();

      // Get participant ID from registry
      const registryProvider = this.providerRegistry?.getProviderByAddress(
        provider.address,
      );
      const participantId =
        registryProvider?.participantId || federatedDataset.participantId;

      if (!participantId) {
        throw new Error(
          `No participant ID found for provider ${provider.name}`,
        );
      }

      // Ensure the policy has the required target field
      const processedPolicy = {
        ...policyDefinition,
        target: policyDefinition.target || assetId, // Set target to assetId if not present
      };

      // Use the processed policy with correct target field
      const negotiationId = await (store as any).negotiateContract(
        provider.address,
        assetId,
        processedPolicy,
        participantId,
      );

      this.negotiations.set(negotiationKey, {
        status: 'pending',
        negotiationId,
        offerId,
        provider,
        assetId,
      });
      this.render();

      this.pollNegotiationStatus(negotiationKey, negotiationId);
    } catch (error) {
      console.error('Contract negotiation failed:', error);
      const negotiationKey = `${dataset['@id']}@${provider.address}`;
      this.negotiations.set(negotiationKey, {
        status: 'failed',
        error: (error as Error).message,
        provider,
        assetId: dataset['@id'],
      });
      this.render();
    }
  },

  async pollNegotiationStatus(negotiationKey: string, negotiationId: string) {
    const maxAttempts = 8;
    const pollInterval = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const store = this.stores.get('default');
        if (!store) {
          console.error('Store not available for polling');
          return;
        }

        const status = await (store as any).getNegotiationStatus(negotiationId);
        const negotiation = this.negotiations.get(negotiationKey);

        this.negotiations.set(negotiationKey, {
          ...negotiation,
          status: 'pending',
          currentState: status.state,
          attempt: attempt + 1,
          maxAttempts,
        });
        this.render();

        if (status.state === 'FINALIZED' || status.state === 'AGREED') {
          // Automatically retrieve contract agreement when finalized
          try {
            const agreement = await (store as any).getContractAgreement(
              negotiationId,
            );
            const contractId = agreement
              ? agreement['@id']
              : status.contractAgreementId || negotiationId;

            this.negotiations.set(negotiationKey, {
              ...negotiation,
              status: 'granted',
              contractId,
              agreement,
            });
          } catch (error) {
            console.error('Failed to retrieve contract agreement:', error);
            this.negotiations.set(negotiationKey, {
              ...negotiation,
              status: 'granted',
              contractId: status.contractAgreementId || negotiationId,
            });
          }
          this.render();
          return;
        }

        if (status.state === 'TERMINATED') {
          this.negotiations.set(negotiationKey, {
            ...negotiation,
            status: 'failed',
            error: status.errorDetail || 'Negotiation terminated',
          });
          this.render();
          return;
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error(
          `Error polling negotiation status (attempt ${attempt + 1}):`,
          error,
        );
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    // Timeout
    const negotiation = this.negotiations.get(negotiationKey);
    this.negotiations.set(negotiationKey, {
      ...negotiation,
      status: 'failed',
      error:
        'Negotiation timeout after 5 minutes - may still be processing on provider side',
    });
    this.render();
  },

  async initiateEDRTransfer(
    federatedDataset: FederatedDataset,
    negotiation: any,
  ) {
    const { dataset, provider } = federatedDataset;
    const assetId = dataset['@id'];
    const negotiationKey = `${assetId}@${provider.address}`;

    try {
      // Update UI to show loading
      this.negotiations.set(negotiationKey, {
        ...negotiation,
        status: 'transferring',
      });
      this.render();

      const store = this.stores.get('default');
      if (!store) {
        throw new Error('Store not available for EDR transfer');
      }

      const transferId = await (store as any).initiateEDRTransfer(
        assetId,
        provider.address,
        negotiation.contractId,
      );

      // Get EDR token
      const edrDataAddress = await (store as any).getEDRToken(transferId);
      if (!edrDataAddress) {
        throw new Error('Failed to retrieve EDR token');
      }

      // Transform localhost endpoint to public provider address
      let transformedEndpoint = edrDataAddress.endpoint;
      if (
        transformedEndpoint.includes('localhost') ||
        transformedEndpoint.includes('127.0.0.1')
      ) {
        // Extract the provider's public address from the protocol address
        // provider.address is like "https://provider.connector-dev.startinblox.com/protocol"
        const providerBase = provider.address.replace('/protocol', '');
        const localUrl = new URL(transformedEndpoint);
        transformedEndpoint = `${providerBase}${localUrl.pathname}${localUrl.search}`;
      }

      // Update negotiation with transfer and token info
      this.negotiations.set(negotiationKey, {
        ...negotiation,
        status: 'granted',
        transferId,
        edrToken: edrDataAddress.authorization,
        edrEndpoint: transformedEndpoint,
      });
      this.render();
    } catch (error) {
      console.error('EDR transfer failed:', error);
      this.negotiations.set(negotiationKey, {
        ...negotiation,
        status: 'granted', // Keep as granted but show error
        transferError: (error as Error).message,
      });
      this.render();
    }
  },

  async accessData(federatedDataset: FederatedDataset, negotiation: any) {
    const { dataset, provider } = federatedDataset;
    const assetId = dataset['@id'];
    const negotiationKey = `${assetId}@${provider.address}`;

    try {
      // Update UI to show data access in progress
      this.negotiations.set(negotiationKey, {
        ...negotiation,
        status: 'accessing-data',
      });
      this.render();

      const store = this.stores.get('default');
      if (!store || !negotiation.edrToken || !negotiation.edrEndpoint) {
        throw new Error('Missing store or EDR token information');
      }

      // Transform localhost endpoint to public provider address if needed
      let transformedEndpoint = negotiation.edrEndpoint;
      if (
        transformedEndpoint.includes('localhost') ||
        transformedEndpoint.includes('127.0.0.1')
      ) {
        const providerBase = provider.address.replace('/protocol', '');
        const localUrl = new URL(transformedEndpoint);
        transformedEndpoint = `${providerBase}${localUrl.pathname}${localUrl.search}`;
      }

      const edrDataAddress = {
        endpoint: transformedEndpoint,
        authorization: negotiation.edrToken,
        authType: 'bearer',
        type: 'https://w3id.org/idsa/v4.1/HTTP',
        endpointType: 'https://w3id.org/idsa/v4.1/HTTP',
      };

      // Implement long-polling strategy with up to 1 minute timeout
      const data = await this.fetchDataWithLongPolling(
        store,
        edrDataAddress,
        assetId,
        provider,
      );

      // For demo purposes, show a simple preview
      const preview = JSON.stringify(data, null, 2).substring(0, 500);
      alert(
        `Data retrieved successfully!\n\nPreview (first 500 chars):\n${preview}${JSON.stringify(data).length > 500 ? '...' : ''}`,
      );

      // Reset status back to granted after successful data access
      this.negotiations.set(negotiationKey, {
        ...negotiation,
        status: 'granted',
      });
      this.render();
    } catch (error) {
      console.error('Data access failed:', error);

      // Reset status back to granted with error
      this.negotiations.set(negotiationKey, {
        ...negotiation,
        status: 'granted',
        dataAccessError: (error as Error).message,
      });
      this.render();

      alert(`Data access failed: ${(error as Error).message}`);
    }
  },

  async fetchDataWithLongPolling(
    store: any,
    edrDataAddress: any,
    assetId: string,
    provider: any,
    maxAttempts = 12, // 12 attempts over 1 minute
    pollInterval = 5000, // 5 seconds between attempts
  ) {
    const negotiationKey = `${assetId}@${provider.address}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Update UI with current attempt progress
      const currentNegotiation = this.negotiations.get(negotiationKey);
      if (currentNegotiation) {
        this.negotiations.set(negotiationKey, {
          ...currentNegotiation,
          status: 'accessing-data',
          dataAccessAttempt: attempt,
          dataAccessMaxAttempts: maxAttempts,
        });
        this.render();
      }

      try {
        const data = await store.fetchWithEDRToken(edrDataAddress);

        if (data) {
          return data;
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.warn(
          `⚠️ Data access attempt ${attempt}/${maxAttempts} failed:`,
          errorMessage,
        );

        // Check for specific error types that might resolve with waiting
        const isRetryableError =
          errorMessage.includes('404') ||
          errorMessage.includes('503') ||
          errorMessage.includes('502') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('not ready') ||
          errorMessage.includes('processing');

        // If this is the last attempt or not a retryable error, throw
        if (attempt === maxAttempts || !isRetryableError) {
          console.error(`❌ Final data access attempt failed: ${errorMessage}`);
          throw error;
        }
      }

      // Wait before next attempt (except on the last iteration)
      if (attempt < maxAttempts) {
        // Show countdown in UI during wait
        for (let countdown = pollInterval / 1000; countdown > 0; countdown--) {
          const currentNegotiation = this.negotiations.get(negotiationKey);
          if (currentNegotiation) {
            this.negotiations.set(negotiationKey, {
              ...currentNegotiation,
              status: 'accessing-data',
              dataAccessAttempt: attempt,
              dataAccessMaxAttempts: maxAttempts,
              countdown: countdown,
            });
            this.render();
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw new Error(
      `Data access failed after ${maxAttempts} attempts over ${(maxAttempts * pollInterval) / 1000} seconds`,
    );
  },

  toggleProvider(providerAddress: string) {
    if (this.selectedProviders.has(providerAddress)) {
      this.selectedProviders.delete(providerAddress);
    } else {
      this.selectedProviders.add(providerAddress);
    }
    this.render();
  },

  handleSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.render();
  },

  render() {
    if (this.loading && this.federatedDatasets.length === 0) {
      render(
        html`<div class="loading">Loading federated catalog...</div>`,
        this.element,
      );
      return;
    }

    if (this.error && this.federatedDatasets.length === 0) {
      render(html`<div class="error">Error: ${this.error}</div>`, this.element);
      return;
    }

    const filteredDatasets = this.getFilteredDatasets();

    const template = html`
      <div class="edc-federated-catalog">
        ${this.renderHeader()}
        ${this.showStats ? this.renderStats() : ''}
        ${this.showProviderFilter ? this.renderProviderFilter() : ''}
        ${this.renderSearchBox()}
        ${this.renderDatasets(filteredDatasets)}
      </div>
    `;

    render(template, this.element);
  },

  renderHeader() {
    const totalDatasets = this.federatedDatasets.length;
    const totalProviders = this._providersArray.length;
    const activeProviders = (
      Array.from(this.providerStats.values()) as ProviderStatus[]
    ).filter((stat: ProviderStatus) => stat.status === 'success').length;

    // Get breakdown of datasets by provider
    const providerBreakdown = (
      Array.from(this.providerStats.values()) as ProviderStatus[]
    )
      .filter(
        (stat: ProviderStatus) =>
          stat.status === 'success' && stat.datasetCount > 0,
      )
      .map(
        (stat: ProviderStatus) =>
          `${stat.datasetCount} from ${stat.provider.name}`,
      )
      .join(', ');

    return html`
      <div class="federated-header">
        <h2>Federated EDC Catalog</h2>
        <p>
          ${totalDatasets} unique datasets 
          ${providerBreakdown ? html`(${providerBreakdown})` : ''}
          from ${activeProviders}/${totalProviders} providers
          ${this.loading ? html`<span class="loading-indicator">⏳ Loading...</span>` : ''}
        </p>
      </div>
    `;
  },

  renderStats() {
    if (this.providerStats.size === 0) return '';

    return html`
      <div class="provider-stats">
        <h3>Provider Status</h3>
        <div class="stats-grid">
          ${(Array.from(this.providerStats.values()) as ProviderStatus[]).map(
            (stat: ProviderStatus) => html`
            <div class="stat-card ${stat.status}">
              <div class="stat-provider">
                ${stat.provider.name}
                ${
                  this.loadingProviders.has(stat.provider.address)
                    ? html`<span class="loading-spinner">⏳</span>`
                    : ''
                }
              </div>
              <div class="stat-count">${stat.datasetCount} datasets</div>
              <div class="stat-status">
                ${stat.status === 'success' ? '✅' : '❌'}
                ${stat.status}
              </div>
              ${stat.error ? html`<div class="stat-error">${stat.error}</div>` : ''}
            </div>
          `,
          )}
        </div>
      </div>
    `;
  },

  renderProviderFilter() {
    if (this._providersArray.length === 0) return '';

    return html`
      <div class="provider-filter">
        <h4>Filter by Provider</h4>
        <div class="provider-checkboxes">
          ${this._providersArray.map(
            provider => html`
            <label class="provider-checkbox">
              <input 
                type="checkbox" 
                .checked=${this.selectedProviders.has(provider.address)}
                @change=${() => this.toggleProvider(provider.address)}
              >
              <span class="provider-name">${provider.name}</span>
              <span class="provider-count">
                (${this.providerStats.get(provider.address)?.datasetCount || 0})
              </span>
            </label>
          `,
          )}
        </div>
      </div>
    `;
  },

  renderSearchBox() {
    return html`
      <div class="search-box">
        <input
          type="text"
          placeholder="Search datasets, descriptions, keywords, or providers..."
          .value=${this.searchQuery}
          @input=${(e: Event) => this.handleSearchInput(e)}
          @keyup=${(e: Event) => this.handleSearchInput(e)}
          class="search-input"
        >
      </div>
    `;
  },

  renderDatasets(datasets: FederatedDataset[]) {
    if (datasets.length === 0) {
      if (this.federatedDatasets.length === 0) {
        return html`<div class="empty">No datasets found in federated catalog</div>`;
      }
      return html`<div class="empty">No datasets match your current filters</div>`;
    }

    return html`
      <div class="federated-datasets-list">
        ${datasets.map(item => this.renderDatasetItem(item))}
      </div>
    `;
  },

  renderDatasetItem(item: FederatedDataset) {
    const { dataset, provider } = item;
    const negotiationKey = `${dataset['@id']}@${provider.address}`;

    return html`
      <div class="federated-dataset-item" data-dataset-id="${dataset['@id']}" data-provider="${provider.address}">
        <div class="dataset-header">
          <h3 class="dataset-title">
            ${dataset['dcterms:title'] || dataset['dct:title'] || dataset.properties?.name || dataset['@id']}
          </h3>
          <div class="provider-badge" style="background-color: ${provider.color || '#1976d2'}">
            ${provider.name}
          </div>
        </div>
        
        ${
          dataset['rdfs:comment'] || dataset.properties?.description
            ? html`<p class="dataset-description">
              ${dataset['rdfs:comment'] || dataset.properties?.description}
            </p>`
            : ''
        }
        
        <div class="dataset-metadata">
          <span class="dataset-id">ID: ${dataset['@id']}</span>
          <span class="dataset-provider">Provider: ${provider.address}</span>
          ${
            dataset['dcterms:creator']
              ? html`<span class="dataset-creator">Creator: ${dataset['dcterms:creator']}</span>`
              : ''
          }
          ${
            dataset['dcat:keyword']?.length > 0
              ? html`<span class="dataset-keywords">Keywords: ${dataset['dcat:keyword'].join(', ')}</span>`
              : ''
          }
          ${
            this.getPoliciesFromDataset(dataset).length > 0
              ? html`<span class="dataset-policies">Policies: ${this.getPoliciesFromDataset(dataset).length}</span>`
              : ''
          }
        </div>
        
        <div class="dataset-actions">
          ${this.renderNegotiationButton(item, negotiationKey)}
        </div>
      </div>
    `;
  },

  renderNegotiationButton(item: FederatedDataset, negotiationKey: string) {
    const { dataset, provider } = item;
    const negotiation = this.negotiations.get(negotiationKey);
    const assetId = dataset['@id'];

    const policies = this.getPoliciesFromDataset(dataset);
    if (policies.length === 0) {
      return html`<span class="no-policy">No policies available</span>`;
    }

    // Check for existing agreement if no current negotiation
    if (!negotiation) {
      const store = this.stores.get('default');
      if (store) {
        const existingAgreement = (store as any).getAssetAgreement(assetId);
        if (existingAgreement) {
          return html`<button class="negotiate-btn existing-agreement" @click=${() => this.negotiateAccess(item)}>
            ♻️ Use Existing Agreement
          </button>`;
        }
      }
    }

    if (negotiation) {
      switch (negotiation.status) {
        case 'negotiating':
          return html`<button class="negotiate-btn negotiating" disabled>
            <span class="spinner">⏳</span> Negotiating with ${provider.name}...
          </button>`;
        case 'pending':
          return html`<div class="negotiation-info">
            <span class="negotiation-provider">Provider: ${provider.name}</span>
            <span class="negotiation-id">Negotiation: ${negotiation.negotiationId}</span>
            <span class="negotiation-status pending">
              <span class="spinner">⏳</span>
              ${negotiation.currentState || 'Pending'}
              ${negotiation.attempt ? `(${negotiation.attempt}/${negotiation.maxAttempts})` : ''}
            </span>
          </div>`;
        case 'transferring':
          return html`<div class="negotiation-info">
            <span class="negotiation-provider">Provider: ${provider.name}</span>
            <span class="contract-id">Contract: ${negotiation.contractId}</span>
            <span class="negotiation-status pending">
              <span class="spinner">🚀</span> Getting EDR Token...
            </span>
          </div>`;
        case 'accessing-data': {
          const progressPercent =
            negotiation.dataAccessAttempt && negotiation.dataAccessMaxAttempts
              ? (negotiation.dataAccessAttempt /
                  negotiation.dataAccessMaxAttempts) *
                100
              : 0;

          return html`<div class="negotiation-info">
            <span class="negotiation-provider">Provider: ${provider.name}</span>
            <span class="contract-id">Contract: ${negotiation.contractId}</span>
            <span class="negotiation-status pending">
              <span class="spinner">📡</span> Accessing Data
              ${
                negotiation.dataAccessAttempt
                  ? ` (${negotiation.dataAccessAttempt}/${negotiation.dataAccessMaxAttempts})`
                  : '...'
              }
              ${
                negotiation.countdown
                  ? html`<br><span class="countdown">⏳ Next retry in ${negotiation.countdown}s</span>`
                  : ''
              }
            </span>
            ${
              negotiation.dataAccessAttempt
                ? html`<div class="progress-container">
                <div class="progress-bar" style="width: ${progressPercent}%"></div>
              </div>`
                : ''
            }
          </div>`;
        }
        case 'granted':
          return html`<div class="negotiation-success">
            <span class="access-granted">✅ Access Granted via ${provider.name}</span>
            <span class="contract-id">Contract: ${negotiation.contractId}</span>
            ${
              negotiation.transferError
                ? html`
              <span class="transfer-error">⚠️ ${negotiation.transferError}</span>
              <button class="negotiate-btn retry" @click=${() => this.initiateEDRTransfer(item, negotiation)}>
                🔄 Retry EDR
              </button>
            `
                : ''
            }
            <div class="api-access-actions">
              ${
                !negotiation.edrToken
                  ? html`
                <button class="negotiate-btn" @click=${() => this.initiateEDRTransfer(item, negotiation)}>
                  🚀 Get EDR Token
                </button>
              `
                  : html`
                <span class="edr-ready">🔑 EDR Token Ready</span>
                <button class="negotiate-btn" @click=${() => this.accessData(item, negotiation)}>
                  📁 Access Data
                </button>
              `
              }
            </div>
          </div>`;
        case 'failed':
          return html`<div class="negotiation-error">
            <span>Failed with ${provider.name}: ${negotiation.error}</span>
            <button class="negotiate-btn retry" @click=${() => this.negotiateAccess(item)}>
              Retry
            </button>
          </div>`;
        default:
          return html`<button class="negotiate-btn" @click=${() => this.negotiateAccess(item)}>
            Negotiate via ${provider.name}
          </button>`;
      }
    }

    return html`<button class="negotiate-btn" @click=${() => this.negotiateAccess(item)}>
      Negotiate via ${provider.name} (${policies.length} ${policies.length === 1 ? 'policy' : 'policies'})
    </button>`;
  },
};

Sib.register(EdcFederatedCatalogDisplay);
