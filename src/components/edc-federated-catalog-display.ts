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
          console.log('Providers parsed:', this._providersArray);
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
      console.log('No providers available for registry initialization');
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
    console.log(
      '✅ Provider registry initialized with',
      providerInfos.length,
      'providers:',
      providerInfos,
    );
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
          console.log(
            `Fetching catalog from ${provider.name} (${provider.address})`,
          );
          const catalog = await (store as any).getCatalog(provider.address);

          if (catalog) {
            this.catalogs.set(provider.address, { catalog, provider });
            const datasets = catalog['dcat:dataset'] || [];

            // Update provider registry with discovered participant ID
            if (catalog.participantId && this.providerRegistry) {
              const registryProvider =
                this.providerRegistry.getProviderByAddress(provider.address);
              if (registryProvider) {
                registryProvider.participantId = catalog.participantId;
                registryProvider.status = 'online';
                registryProvider.lastSeen = new Date().toISOString();
                console.log(
                  `✅ Discovered participant ID for ${provider.name}: ${catalog.participantId}`,
                );
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

      console.log(
        `Federated catalog loaded: ${this.federatedDatasets.length} unique datasets from ${this._providersArray.length} providers`,
      );
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
        const currentPolicies = item.dataset['odrl:hasPolicy']?.length || 0;
        const existingPolicies =
          existing.dataset['odrl:hasPolicy']?.length || 0;

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
    console.log('After provider filtering:', filtered.length, 'datasets');

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

        const matches = (
          title.includes(query) ||
          description.includes(query) ||
          keywords.includes(query) ||
          providername.includes(query) ||
          dataset['@id'].toLowerCase().includes(query)
        );

        console.log(`Dataset ${dataset['@id']}: title="${title}", matches=${matches}`);
        return matches;
      });
    }

    return filtered;
  },

  async negotiateAccess(federatedDataset: FederatedDataset) {
    const { dataset, provider } = federatedDataset;

    if (!dataset['odrl:hasPolicy'] || dataset['odrl:hasPolicy'].length === 0) {
      console.error('No policies available for dataset:', dataset['@id']);
      return;
    }

    try {
      // Use the second policy instead of the first one
      const offer = dataset['odrl:hasPolicy'];
      console.log('Selected offer for negotiation:', dataset, offer);
      if (!offer) {
        throw new Error('No valid offer found for negotiation');
      }

      const offerId = offer['@id'];
      const assetId = dataset['@id'];

      const policyIndex = dataset['odrl:hasPolicy'][0] ? 0 : 0;
      console.log(
        `Starting negotiation for asset ${assetId} with provider ${provider.name} (${provider.address})`,
      );
      console.log('Available policies for dataset:', dataset['odrl:hasPolicy']);
      console.log(`Selected offer policy (index ${policyIndex}):`, offer);

      // Create negotiation key that includes provider
      const negotiationKey = `${assetId}@${provider.address}`;

      this.negotiations.set(negotiationKey, {
        status: 'negotiating',
        offerId,
        provider,
        assetId,
      });
      this.render();

      const store = this.stores.get('default');
      if (!store) {
        console.error('Store not available for negotiation');
        return;
      }

      const modifiedOffer = {
        ...offer,
        target: assetId,
      };

      console.log('Provider Registry:', this.providerRegistry);
      console.log('Provider:', provider);
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

      const negotiationId = await (store as any).initiateNegotiation(
        provider.address,
        assetId,
        modifiedOffer,
        participantId,
      );

      console.log(
        `Negotiation initiated: ${negotiationId} with ${provider.name}`,
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

        console.log(
          `Polling attempt ${attempt + 1}: Negotiation ${negotiationId} state: ${status.state}`,
        );

        this.negotiations.set(negotiationKey, {
          ...negotiation,
          status: 'pending',
          currentState: status.state,
          attempt: attempt + 1,
          maxAttempts,
        });
        this.render();

        if (status.state === 'FINALIZED' || status.state === 'AGREED') {
          this.negotiations.set(negotiationKey, {
            ...negotiation,
            status: 'granted',
            contractId: status.contractAgreementId || negotiationId,
          });
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
            dataset['odrl:hasPolicy']?.length > 0
              ? html`<span class="dataset-policies">Policies: ${dataset['odrl:hasPolicy'].length}</span>`
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

    if (!dataset['odrl:hasPolicy'] || dataset['odrl:hasPolicy'].length === 0) {
      return html`<span class="no-policy">No policies available</span>`;
    }

    if (negotiation) {
      switch (negotiation.status) {
        case 'negotiating':
          return html`<button class="negotiate-btn negotiating" disabled>
            Negotiating with ${provider.name}...
          </button>`;
        case 'pending':
          return html`<div class="negotiation-info">
            <span class="negotiation-provider">Provider: ${provider.name}</span>
            <span class="negotiation-id">Negotiation: ${negotiation.negotiationId}</span>
            <span class="negotiation-status pending">
              ${negotiation.currentState || 'Pending'} 
              ${negotiation.attempt ? `(${negotiation.attempt}/${negotiation.maxAttempts})` : ''}
            </span>
          </div>`;
        case 'granted':
          return html`<div class="negotiation-success">
            <span class="access-granted">✅ Access Granted via ${provider.name}</span>
            <span class="contract-id">Contract: ${negotiation.contractId}</span>
            <button class="api-ready-btn" disabled>
              API Ready
            </button>
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
      Negotiate via ${provider.name} (${dataset['odrl:hasPolicy'].length} ${dataset['odrl:hasPolicy'].length === 1 ? 'policy' : 'policies'})
    </button>`;
  },
};

Sib.register(EdcFederatedCatalogDisplay);
