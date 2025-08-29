import { Sib } from '../libs/Sib.ts';
import { html, render } from 'lit';
import { WidgetMixin } from '../mixins/widgetMixin.ts';
import { AttributeBinderMixin } from '../mixins/attributeBinderMixin.ts';
import { StoreService } from '../libs/store/storeService.ts';
import type { DataspaceConnectorConfig } from '../libs/store/dataspace-connector/types.ts';
import { StoreType } from '../libs/store/IStore.ts';

export const EdcCatalogDisplay = {
  name: 'edc-catalog-display',
  use: [WidgetMixin, AttributeBinderMixin],
  attributes: {
    connectorUri: {
      type: String,
      default: null,
      callback: function (value: string) {
        if (value && this.apiKey && this.counterPartyAddress) {
          this.fetchCatalog();
        }
      },
    },
    apiKey: {
      type: String,
      default: null,
      callback: function (value: string) {
        if (value && this.connectorUri && this.counterPartyAddress) {
          this.fetchCatalog();
        }
      },
    },
    counterPartyAddress: {
      type: String,
      default: null,
      callback: function (value: string) {
        if (value && this.connectorUri && this.apiKey) {
          this.fetchCatalog();
        }
      },
    },
    defaultWidget: {
      type: String,
      default: 'edc-dataset-item',
    },
  },
  initialState: {
    catalog: null,
    datasets: [],
    loading: false,
    error: null,
  },
  created() {
    if (this.connectorUri && this.apiKey && this.counterPartyAddress) {
      this.fetchCatalog();
    }
  },
  
  async fetchCatalog() {
    if (!this.connectorUri || !this.apiKey || !this.counterPartyAddress) return;
    
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const config: DataspaceConnectorConfig = {
        type: StoreType.DataspaceConnector,
        endpoint: this.connectorUri,
        catalogEndpoint: `${this.connectorUri}/v3/catalog/request`,
        contractNegotiationEndpoint: `${this.connectorUri}/v3/contractnegotiations`,
        transferProcessEndpoint: `${this.connectorUri}/v3/transferprocesses`,
        authMethod: 'edc-api-key',
        edcApiKey: this.apiKey,
        retryAttempts: 3,
        timeout: 30000,
      };

      // Force reset of StoreService to allow reinitialization
      StoreService.currentStore = null;
      StoreService.currentConfig = null;

      StoreService.init(config);
      const store = StoreService.getInstance();

      const catalog = await (store as any).getCatalog(this.counterPartyAddress);
      this.catalog = catalog;
      this.datasets = catalog?.['dcat:dataset'] || [];
      
    } catch (error) {
      console.error('Failed to fetch EDC catalog:', error);
      this.error = (error as Error).message;
      this.catalog = null;
      this.datasets = [];
    } finally {
      this.loading = false;
      this.render();
    }
  },

  render() {
    if (this.loading) {
      render(html`<div class="loading">Loading catalog...</div>`, this.element);
      return;
    }

    if (this.error) {
      render(
        html`<div class="error">Error: ${this.error}</div>`,
        this.element,
      );
      return;
    }

    if (!this.datasets || this.datasets.length === 0) {
      render(html`<div class="empty">No datasets found in catalog</div>`, this.element);
      return;
    }

    const template = html`
      <div class="edc-catalog-info">
        ${this.catalog ? html`
          <div class="catalog-header">
            <h2>Catalog: ${this.catalog['@id']}</h2>
            <p>Provider: ${this.catalog.participantId}</p>
            <p>Datasets: ${this.datasets.length}</p>
          </div>
        ` : ''}
      </div>
      <div class="edc-datasets-list">
        ${this.datasets.map(
          dataset => html`
            <div class="edc-dataset-item" data-dataset-id="${dataset['@id']}">
              <h3 class="dataset-title">
                ${dataset['dcterms:title'] || dataset.properties?.name || dataset['@id']}
              </h3>
              ${dataset['dcterms:description'] || dataset.properties?.description
                ? html`<p class="dataset-description">
                    ${dataset['dcterms:description'] || dataset.properties?.description}
                  </p>`
                : ''}
              <div class="dataset-metadata">
                <span class="dataset-id">ID: ${dataset['@id']}</span>
                ${dataset['dcterms:creator']
                  ? html`<span class="dataset-creator">Creator: ${dataset['dcterms:creator']}</span>`
                  : ''}
                ${dataset['dcat:keyword']?.length
                  ? html`<span class="dataset-keywords">Keywords: ${dataset['dcat:keyword'].join(', ')}</span>`
                  : ''}
                ${dataset['odrl:hasPolicy']?.length
                  ? html`<span class="dataset-policies">Policies: ${dataset['odrl:hasPolicy'].length}</span>`
                  : ''}
              </div>
            </div>
          `,
        )}
      </div>
    `;

    render(template, this.element);
  },
};

Sib.register(EdcCatalogDisplay);