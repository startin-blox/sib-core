import { uniqID } from '../../helpers/index.js';
import { SIBWidget } from '../../parents/index.js';

export class SIBFormTextarea extends SIBWidget {
  get template() {
    const id = uniqID();
    return `<label for="${id}">${this.label}</label>
    <textarea
      id="${id}"
      type="text"
      name="${this.name}"
    >${this.escapedValue}</textarea>`;
  }
}
customElements.define('sib-form-textarea', SIBFormTextarea);
