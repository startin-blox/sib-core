import dialogPolyfill from 'dialog-polyfill'
import { html } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';
import { uniqID } from '../libs/helpers';

const ValidationMixin = {
  name: 'validation-mixin',
  use: [],
  attributes: {
    confirmationMessage: {
      type: String,
      default: 'Please, confirm your choice.'
    },
    confirmationType: {
      type: String,
      default: null
    },
    confirmationSubmitText: {
      type: String,
      default: 'Yes'
    },
    confirmationCancelText: {
      type: String,
      default: 'Cancel'
    },
    confirmationSubmitClass: {
      type: String,
      default: undefined
    },
    confirmationCancelClass: {
      type: String,
      default: undefined
    }
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
    if (this.element.hasAttribute('confirmation-message') && !this.confirmationType) console.warn('confirmation-type attribute is missing.');
    // Data directly submitted OR confirm dialog modal displayed
    if ((!this.confirmationType) || (this.confirmationType == "confirm" && confirm(this.confirmationMessage))) this.validateModal();
    // Customisable dialog modal opened
    if (this.confirmationType == "dialog") {
      this.showModal();
    }
  },
  getModalDialog() {
    if (this.confirmationType == 'dialog') {
      const quitDialog = () => {
        var dialog: any = document.getElementById(this.dialogID);
        if (dialog == null) return;
        dialog.close();
      }
      const confirmChoice = () => {
        this.validateModal();
        quitDialog();
      }
      return html`
        <dialog id="${this.dialogID}">
          <p>${this.confirmationMessage}</p>
          <div>
            <button
              @click=${confirmChoice} 
              class=${ifDefined(this.confirmationSubmitClass)}
            >
            ${this.confirmationSubmitText}
            </button>
            <button
              @click=${quitDialog}
              class=${ifDefined(this.confirmationCancelClass)}
            >
            ${this.confirmationCancelText}
            </button>
          </div>
        </dialog>
      `
    } else return '';
  },
}

export {
  ValidationMixin
}