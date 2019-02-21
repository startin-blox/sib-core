import { uniqID } from '../../helpers/index.js';
import { SIBWidgetLegacy } from '../../parents/index.js';

export default class SIBFormPlaceholderText extends SIBWidgetLegacy {
  get template() {
    const id = uniqID();
    return `<input
      id="${id}"
      placeholder="${this.label}"
      type="text"
      name="${this.name}"
      value="${this.escapedValue}"
    >`;
  }
}
customElements.define('sib-form-placeholder-text', SIBFormPlaceholderText);
