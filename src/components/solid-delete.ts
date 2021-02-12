import { Sib } from '../libs/Sib';
import { base_context, store } from '../libs/store/store';
import { NextMixin } from '../mixins/nextMixin';
import { uniqID } from '../libs/helpers';

import { html, render } from 'lit-html';

export const SolidDelete = {
  name: 'solid-delete',
  use: [NextMixin],
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
    },
    confirmationMessage: {
      type: String,
      default: null
    },
    modalDialog: {
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
    if ((!this.confirmationMessage) || (this.confirmationMessage && confirm(this.confirmationMessage))) {
      if (this.modalDialog) {
        var dialog : any = document.getElementById(this.dialogID);
        dialog.showModal();
      }
      else this.deletion();
    };
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
  getModalDialog() {
    this.dialogID = uniqID();
    const quitDialog = () => {
      var dialog : any = document.getElementById(this.dialogID);
      if(dialog == null) return;
      dialog.removeAttribute('open');
    }
    const deletion = () =>  {
      this.deletion();
      quitDialog();
    }
    return html`
      <dialog id="${this.dialogID}">
        <p>${this.modalDialog}</p>
        <div>
          <button @click=${deletion}>Yes</button>
          <button @click=${quitDialog}>Cancel</button>
        </div>
      </dialog>
      `
  },
  render(): void {
    const button = html`
      <button @click=${this.delete.bind(this)}>${this.dataLabel}</button>
      ${this.modalDialog ? this.getModalDialog() : ''}
    `;
    render(button, this.element);
  }
};

Sib.register(SolidDelete);