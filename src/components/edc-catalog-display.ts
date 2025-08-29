import { html, render } from 'lit';
import { Sib } from '../libs/Sib.ts';
import { StoreType } from '../libs/store/IStore.ts';
import { StoreFactory } from '../libs/store/StoreFactory.ts';
import type { DataspaceConnectorConfig } from '../libs/store/dataspace-connector/types.ts';
import { AttributeBinderMixin } from '../mixins/attributeBinderMixin.ts';
import { WidgetMixin } from '../mixins/widgetMixin.ts';

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
    negotiations: new Map(),
    store: null,
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
        retryAttempts: 60,
        timeout: 30000,
      };

      const store = StoreFactory.create(config);

      const catalog = await (store as any).getCatalog(this.counterPartyAddress);
      this.catalog = catalog;
      this.datasets = catalog?.['dcat:dataset'] || [];
      this.store = store;
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

  async negotiateAccess(dataset: any) {
    if (!dataset['odrl:hasPolicy'] || dataset['odrl:hasPolicy'].length === 0) {
      console.error('No policies available for dataset:', dataset['@id']);
      return;
    }

    try {
      // Get the first available offer policy
      const offer = dataset['odrl:hasPolicy'][0];
      const offerId = offer['@id'];
      const assetId = dataset['@id'];

      console.log(
        `Starting negotiation for asset ${assetId} with offer ${offerId}`,
      );
      console.log('Dataset:', dataset);
      console.log('Offer policy:', offer);

      // Mark this dataset as negotiating
      this.negotiations.set(assetId, { status: 'negotiating', offerId });
      this.render();

      if (!this.store) {
        console.error('Store not available for negotiation');
        return;
      }
      const store = this.store;
      // Set the target in the offer to be the assetId for proper EDC v3 format
      const modifiedOffer = {
        ...offer,
        target: assetId,
      };

      const negotiationId = await (store as any).initiateNegotiation(
        this.counterPartyAddress,
        assetId,
        modifiedOffer,
      );

      console.log(`Negotiation initiated: ${negotiationId}`);

      // Update negotiation status to pending and start polling
      this.negotiations.set(assetId, {
        status: 'pending',
        negotiationId,
        offerId,
      });
      this.render();

      // Start polling for negotiation completion
      this.pollNegotiationStatus(assetId, negotiationId);
    } catch (error) {
      console.error('Contract negotiation failed:', error);
      this.negotiations.set(dataset['@id'], {
        status: 'failed',
        error: (error as Error).message,
      });
      this.render();
    }
  },

  async pollNegotiationStatus(assetId: string, negotiationId: string) {
    const maxAttempts = 60; // Increase attempts to 5 minutes
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (!this.store) {
          console.error('Store not available for polling');
          return;
        }
        const store = this.store;
        const status = await (store as any).getNegotiationStatus(negotiationId);

        console.log(
          `Polling attempt ${attempt + 1}: Negotiation ${negotiationId} state: ${status.state}`,
        );

        // Update UI to show current state and progress
        this.negotiations.set(assetId, {
          status: 'pending',
          negotiationId,
          currentState: status.state,
          attempt: attempt + 1,
          maxAttempts,
        });
        this.render();

        if (status.state === 'FINALIZED' || status.state === 'AGREED') {
          // Negotiation successful
          this.negotiations.set(assetId, {
            status: 'granted',
            negotiationId,
            contractId: status.contractAgreementId || negotiationId,
          });
          this.render();
          return;
        }

        if (status.state === 'TERMINATED') {
          // Negotiation failed
          this.negotiations.set(assetId, {
            status: 'failed',
            error: status.errorDetail || 'Negotiation terminated',
          });
          this.render();
          return;
        }

        // Still pending, continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error(
          `Error polling negotiation status (attempt ${attempt + 1}):`,
          error,
        );
        // Continue polling even on errors - might be temporary network issues
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    // Timeout
    this.negotiations.set(assetId, {
      status: 'failed',
      error:
        'Negotiation timeout after 5 minutes - may still be processing on provider side',
    });
    this.render();
  },

  render() {
    if (this.loading) {
      render(html`<div class="loading">Loading catalog...</div>`, this.element);
      return;
    }

    if (this.error) {
      render(html`<div class="error">Error: ${this.error}</div>`, this.element);
      return;
    }

    if (!this.datasets || this.datasets.length === 0) {
      render(
        html`<div class="empty">No datasets found in catalog</div>`,
        this.element,
      );
      return;
    }

    const template = html`
      <div class="edc-catalog-info">
        ${
          this.catalog
            ? html`
          <div class="catalog-header">
            <h2>Catalog: ${this.catalog['@id']}</h2>
            <p>Provider: ${this.catalog.participantId}</p>
            <p>Datasets: ${this.datasets.length}</p>
          </div>
        `
            : ''
        }
      </div>
      <div class="edc-datasets-list">
        ${this.datasets.map(
          dataset => html`
            <div class="edc-dataset-item" data-dataset-id="${dataset['@id']}">
              <h3 class="dataset-title">
                ${dataset['dcterms:title'] || dataset.properties?.name || dataset['@id']}
              </h3>
              ${
                dataset['dcterms:description'] ||
                dataset.properties?.description
                  ? html`<p class="dataset-description">
                    ${dataset['dcterms:description'] || dataset.properties?.description}
                  </p>`
                  : ''
              }
              <div class="dataset-metadata">
                <span class="dataset-id">ID: ${dataset['@id']}</span>
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
                ${this.renderNegotiationButton(dataset)}
              </div>
            </div>
          `,
        )}
      </div>
    `;

    render(template, this.element);
  },

  renderNegotiationButton(dataset: any) {
    const assetId = dataset['@id'];
    const negotiation = this.negotiations.get(assetId);

    if (!dataset['odrl:hasPolicy'] || dataset['odrl:hasPolicy'].length === 0) {
      return html`<span class="no-policy">No policies available</span>`;
    }

    if (negotiation) {
      switch (negotiation.status) {
        case 'negotiating':
          return html`<button class="negotiate-btn negotiating" disabled>
            Negotiating...
          </button>`;
        case 'pending':
          return html`<div class="negotiation-info">
            <span class="negotiation-id">Negotiation: ${negotiation.negotiationId}</span>
            <span class="negotiation-status pending">
              ${negotiation.currentState || 'Pending'} 
              ${negotiation.attempt ? `(${negotiation.attempt}/${negotiation.maxAttempts})` : ''}
            </span>
          </div>`;
        case 'granted':
          return html`<div class="negotiation-success">
            <span class="access-granted">✅ Access Granted</span>
            <span class="contract-id">Contract: ${negotiation.contractId}</span>
            <button class="api-ready-btn" disabled>
              API Ready
            </button>
          </div>`;
        case 'failed':
          return html`<div class="negotiation-error">
            <span>Failed: ${negotiation.error}</span>
            <button class="negotiate-btn retry" @click=${() => this.negotiateAccess(dataset)}>
              Retry
            </button>
          </div>`;
        default:
          return html`<button class="negotiate-btn" @click=${() => this.negotiateAccess(dataset)}>
            Negotiate Access
          </button>`;
      }
    }

    return html`<button class="negotiate-btn" @click=${() => this.negotiateAccess(dataset)}>
      Negotiate Access (${dataset['odrl:hasPolicy'].length} ${dataset['odrl:hasPolicy'].length === 1 ? 'offer' : 'offers'})
    </button>`;
  },
};

Sib.register(EdcCatalogDisplay);
