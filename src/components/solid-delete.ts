import { Sib } from '../libs/Sib.ts';
import { StoreService } from '../libs/store/storeService.ts';
import { AttributeBinderMixin } from '../mixins/attributeBinderMixin.ts';
import { NextMixin } from '../mixins/nextMixin.ts';
import { ValidationMixin } from '../mixins/validationMixin.ts';

import { html, render } from 'lit';
import { trackRenderAsync } from '../logger.ts';
import { ContextMixin } from '../mixins/contextMixin.ts';

const store = StoreService.getInstance();
if (!store) throw new Error('Store is not available');

export const SolidDelete = {
  name: 'solid-delete',
  use: [NextMixin, ValidationMixin, AttributeBinderMixin, ContextMixin],
  attributes: {
    dataSrc: {
      type: String,
      default: null,
      callback: function () {
        this.resourceId = this.dataSrc;
      },
    },
    dataLabel: {
      type: String,
      default: null,
      callback: function (newValue: string, oldValue: string) {
        if (newValue !== oldValue) this.planRender();
      },
    },
  },
  initialState: {
    renderPlanned: false,
  },
  created(): void {
    this.planRender();
  },
  planRender() {
    if (!this.renderPlanned) {
      this.renderPlanned = true;
      setTimeout(() => {
        this.render();
        this.renderPlanned = false;
      });
    }
  },
  delete(e: Event) {
    e.stopPropagation();
    if (!this.dataSrc) return;
    this.performAction(); // In validationMixin, method defining what to do according to the present attributes
  },
  deletion() {
    return store.delete(this.dataSrc, this.context).then(response => {
      if (!response.ok) return;
      this.goToNext(null);
      const eventData = {
        detail: { resource: { '@id': this.dataSrc } },
        bubbles: true,
      };
      this.element.dispatchEvent(new CustomEvent('save', eventData));
      this.element.dispatchEvent(new CustomEvent('resourceDeleted', eventData)); // Deprecated. To remove in 0.15
    });
  },
  validateModal() {
    // Send method to validationMixin, used by the dialog modal and performAction method
    return this.deletion();
  },
  update() {
    this.render();
  },
  render: trackRenderAsync(async function (): Promise<void> {
    await this.replaceAttributesData(false);
    const button = html`<button @click=${this.delete.bind(this)}>${this.dataLabel || this.t('solid-delete.button')}</button>${this.getModalDialog()}`;
    render(button, this.element);
  }, 'SolidDelete:render'),
};

Sib.register(SolidDelete);
