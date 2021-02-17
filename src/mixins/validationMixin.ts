import { html } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';

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
  getModalDialog() {
    const quitDialog = () => {
      var dialog : any = document.getElementById(this.dialogID);
      if(dialog == null) return;
      dialog.close();
    }
    const submitForm = () =>  {
      this.validateModal();
      quitDialog();
    }
    return html`
      <dialog id="${this.dialogID}">
        <p>${this.confirmationMessage}</p>
        <div>
          <button
            @click=${submitForm} 
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
  },
}

export {
  ValidationMixin
}