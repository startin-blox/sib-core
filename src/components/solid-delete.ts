import { Sib } from '../libs/Sib';
import { base_context, store } from '../libs/store/store';
import { NextMixin } from '../mixins/nextMixin';
import { ValidationMixin } from '../mixins/validationMixin';

import { html, render } from 'lit-html';

export const SolidDelete = {
  name: 'solid-delete',
  use: [NextMixin, ValidationMixin],
  attributes: {
    dataSrc: {
      type: String,
      default: null
    },
    dataLabel: {
      type: String,
      default: null,
      callback: function (newValue: string, oldValue: string) {
        if (newValue !== oldValue) this.render();
      },
    },
    classDeleteButton: {
      type: String,
      default: null,
    },
    extraContext: {
      type: String,
      default: null
    }
  },
  created(): void {
    this.render();
  },
  get context(): object {
    let extraContextElement = this.extraContext ?
      document.getElementById(this.extraContext) : // take element extra context first
      document.querySelector('[data-default-context]'); // ... or look for a default extra context

    let extraContext = {};
    if (extraContextElement) extraContext = JSON.parse(extraContextElement.textContent || "{}");

    return { ...base_context, ...extraContext };
  },
  async delete(e: Event): Promise<void> {
    e.stopPropagation();
    if (!this.dataSrc) return;
    this.performAction(); // In validationMixin, method defining what to do according to the present attributes
  },
  deletion() {
    return store.delete(this.dataSrc, this.context).then(response => {
      if (!response.ok) return;
      this.goToNext(null);
      const eventData = { detail: { resource: { "@id": this.dataSrc } }, bubbles: true };
      this.element.dispatchEvent(new CustomEvent('save', eventData));
      this.element.dispatchEvent(new CustomEvent('resourceDeleted', eventData)); // Deprecated. To remove in 0.15
    })
  },
  validateModal() { // Send method to validationMixin, used by the dialog modal and performAction method
    return this.deletion();
  },
  update() {
    this.render();
  },
  render(): void {
    const button = html`
      ${this.classDeleteButton ? html`
        <div class=${this.classDeleteButton}>
          <button @click=${this.delete.bind(this)}>${this.dataLabel || this.t("solid-delete.button")}</button>
        </div>`
      : html`
        <button @click=${this.delete.bind(this)}>${this.dataLabel || this.t("solid-delete.button")}</button>`
      }
      ${this.getModalDialog()}
    `;
    render(button, this.element);
  }
};

Sib.register(SolidDelete);