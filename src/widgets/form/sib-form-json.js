import { SIBWidget } from '../../parents/index.js';
import { uniqID } from '../../helpers/index.js';

export class SIBFormJSON extends SIBWidget {
  get template() {
    const id = uniqID();
    return `<label for="${id}">${this.label}</label>
    <input
      id="${id}"
      type="text"
      name="${this.name}"
      value='${JSON.stringify(this.value)}'
    >`;
  }
}
customElements.define('sib-form-json', SIBFormJSON);
