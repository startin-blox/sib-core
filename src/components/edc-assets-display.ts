import { html, render } from 'lit';
import { Sib } from '../libs/Sib.ts';
import { StoreFactory } from '../libs/store/StoreFactory.ts';
import type { DataspaceConnectorConfig } from '../libs/store/impl/dataspace-connector/types.ts';
import { StoreType } from '../libs/store/shared/types.ts';
import { AttributeBinderMixin } from '../mixins/attributeBinderMixin.ts';
import { WidgetMixin } from '../mixins/widgetMixin.ts';

export const EdcAssetsDisplay = {
  name: 'edc-assets-display',
  use: [WidgetMixin, AttributeBinderMixin],
  attributes: {
    connectorUri: {
      type: String,
      default: null,
      callback: function (value: string) {
        if (value && this.apiKey) {
          this.fetchAssets();
        }
      },
    },
    apiKey: {
      type: String,
      default: null,
      callback: function (value: string) {
        if (value && this.connectorUri) {
          this.fetchAssets();
        }
      },
    },
    defaultWidget: {
      type: String,
      default: 'edc-asset-item',
    },
  },
  initialState: {
    assets: [],
    loading: false,
    error: null,
  },
  created() {
    if (this.connectorUri && this.apiKey) {
      this.fetchAssets();
    }
  },

  async fetchAssets() {
    console.log('fetchAssets', this.connectorUri, this.apiKey);
    if (!this.connectorUri || !this.apiKey) return;

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
        assetsEndpoint: `${this.connectorUri}/v3/assets/request`,
        authMethod: 'edc-api-key',
        edcApiKey: this.apiKey,
        retryAttempts: 3,
        timeout: 30000,
      };

      // Create temporary store instance for EDC
      const store = StoreFactory.create(config);
      console.log('store', store);
      const assetsRaw = await (store as any).getAssets();

      // Ensure assets is always an array (API might return single object when only one asset)
      this.assets = Array.isArray(assetsRaw)
        ? assetsRaw
        : assetsRaw
          ? [assetsRaw]
          : [];
    } catch (error) {
      console.error('Failed to fetch EDC assets:', error);
      this.error = (error as Error).message;
      this.assets = [];
    } finally {
      this.loading = false;
      this.render();
    }
  },

  render() {
    console.log('render', this.assets);
    if (this.loading) {
      render(html`<div class="loading">Loading assets...</div>`, this.element);
      return;
    }

    if (this.error) {
      render(html`<div class="error">Error: ${this.error}</div>`, this.element);
      return;
    }

    if (!this.assets || this.assets.length === 0) {
      render(html`<div class="empty">No assets found</div>`, this.element);
      return;
    }

    const template = html`
      <div class="edc-assets-list">
        ${this.assets.map(
          asset => html`
            <div class="edc-asset-item" data-asset-id="${asset['@id']}">
              <h3 class="asset-title">
                ${asset['dcterms:title'] || asset.properties?.name || asset['@id']}
              </h3>
              ${
                asset['dcterms:description'] || asset.properties?.description
                  ? html`<p class="asset-description">
                    ${asset['dcterms:description'] || asset.properties?.description}
                  </p>`
                  : ''
              }
              <div class="asset-metadata">
                <span class="asset-id">ID: ${asset['@id']}</span>
                ${
                  asset.properties?.['https://w3id.org/edc/v0.0.1/ns/type']
                    ? html`<span class="asset-type">
                      Type: ${asset.properties['https://w3id.org/edc/v0.0.1/ns/type']}
                    </span>`
                    : ''
                }
              </div>
            </div>
          `,
        )}
      </div>
    `;

    render(template, this.element);
  },
};

Sib.register(EdcAssetsDisplay);
