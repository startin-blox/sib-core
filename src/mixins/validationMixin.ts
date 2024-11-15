import dialogPolyfill from 'dialog-polyfill';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { uniqID } from '../libs/helpers';
import { TranslationMixin } from './translationMixin';
import { preHTML } from '../libs/lit-helpers';

const ValidationMixin = {
  name: 'validation-mixin',
  use: [TranslationMixin],
  attributes: {
    confirmationMessage: {
      type: String,
      default: null,
    },
    confirmationType: {
      type: String,
      default: null,
    },
    confirmationSubmitText: {
      type: String,
      default: null,
    },
    confirmationCancelText: {
      type: String,
      default: null,
    },
    confirmationSubmitClass: {
      type: String,
      default: undefined,
    },
    confirmationCancelClass: {
      type: String,
      default: undefined,
    },
    confirmationWidget: {
      type: String,
      default: undefined,
    },
  },
  created() {
    this.dialogID = uniqID();
  },
  showModal() {
    var dialog: any = document.getElementById(this.dialogID);
    dialogPolyfill.registerDialog(dialog);
    return dialog.showModal();
  },
  performAction() {
    // Console warning if conf-type attr not filled AND conf-message filled
    if (
      this.element.hasAttribute('confirmation-message') &&
      !this.confirmationType
    )
      console.warn('confirmation-type attribute is missing.');
    // Data directly submitted OR confirm dialog modal displayed
    if (
      !this.confirmationType ||
      (this.confirmationType == 'confirm' &&
        confirm(this.confirmationMessage || this.t('validation.message')))
    )
      this.validateModal();
    // Customisable dialog modal opened
    if (this.confirmationType == 'dialog') {
      this.showModal();
    }
  },
  getModalDialog() {
    if (this.confirmationType == 'dialog') {
      const quitDialog = () => {
        var dialog: any = document.getElementById(this.dialogID);
        if (dialog == null) return;
        dialog.close();
      };
      const confirmChoice = () => {
        this.validateModal();
        quitDialog();
      };
      return html`
        <dialog id="${this.dialogID}">
        ${
          this.confirmationWidget
            ? preHTML`<${this.confirmationWidget} value=${this.resourceId}></${this.confirmationWidget}>`
            : html`<p>${this.confirmationMessage || this.t('validation.message')}</p>`
        }
          <div>
            <button
              @click=${confirmChoice} 
              class=${ifDefined(this.confirmationSubmitClass)}
            >
            ${this.confirmationSubmitText || this.t('validation.submit-text')}
            </button>
            <button
              @click=${quitDialog}
              class=${ifDefined(this.confirmationCancelClass)}
            >
            ${this.confirmationCancelText || this.t('validation.cancel-text')}
            </button>
          </div>
        </dialog>
      `;
    } else return '';
  },
};

export { ValidationMixin };
