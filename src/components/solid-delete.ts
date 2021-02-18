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
      default: "Delete",
      callback: function (newValue: string, oldValue: string) {
        if (newValue !== oldValue) this.render();
      },
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
    
    // Console warning if conf-type attr not filled AND conf-message filled
    if (this.element.hasAttribute('confirmation-message') && !this.confirmationType) console.warn('confirmation-type attribute is missing.');
    // Data directly deleted OR confirm dialog modal displayed
    if ((!this.confirmationType) || (this.confirmationType == "confirm" && confirm(this.confirmationMessage))) this.deletion();
    // Customisable dialog modal opened
    if (this.confirmationType == "dialog") {
      this.showModal();
    }
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
  validateModal() { //send method to validationMixin, used in the dialog modal
    return this.deletion();
  },
  render(): void {
    const button = html`
      <button @click=${this.delete.bind(this)}>${this.dataLabel}</button>
      ${this.getModalDialog()}
    `;
    render(button, this.element);
  }
};

Sib.register(SolidDelete);