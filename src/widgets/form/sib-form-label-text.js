import { uniqID } from '../../helpers/index.js';
import { SIBWidgetLegacy } from '../../parents/index.js';

export default class SIBFormLabelText extends SIBWidgetLegacy {
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
