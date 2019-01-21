import { uniqID } from '../../helpers/index.js';
import { SIBWidget } from '../../parents/index.js';

export default class SIBFormCheckbox extends SIBWidget {
  get template() {
    const id = uniqID();
    const checked = this.value ? 'checked' : '';
    return `<label for="${id}">${this.label}</label>
    <input
      id="${id}"
      type="checkbox"
      name="${this.name}"
      ${checked}
    >`;
  }
}

customElements.define('sib-form-checkbox', SIBFormCheckbox);
