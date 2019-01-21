import { uniqID } from '../../helpers/index.js';
import { SIBWidget } from '../../parents/index.js';

export default class SIBFormLabelText extends SIBWidget {
  get template() {
    const id = uniqID();
    return `
    <label for="${id}">${this.label}</label>
    <input id="${id}"
      type="text"
      name="${this.name}"
      value="${this.escapedValue}"
    >`;
  }
}
customElements.define('sib-form-label-text', SIBFormLabelText);
