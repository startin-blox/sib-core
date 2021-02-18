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
    var dialog : any = document.getElementById(this.dialogID);
    return dialog.showModal();
  },
  getModalDialog() {
    const quitDialog = () => {
      var dialog : any = document.getElementById(this.dialogID);
      if(dialog == null) return;
      dialog.close();
    }
    const confirmChoice = () =>  {
      this.validateModal();
      quitDialog();
    }
    if (this.confirmationType == 'dialog') {
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