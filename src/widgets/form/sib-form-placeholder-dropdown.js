
import { store } from '../../store.js';
import SIBFormDropdown from './sib-form-dropdown.js';

export default class SIBFormPlaceholderDropdown extends SIBFormDropdown {
  /* eslint-disable no-underscore-dangle */
  getTemplate(item) {
    const selected = (item.placeholder && !this.value) || this.value === item['@id'];
    return /* html */ `<option
    value='{"@id": "${item['@id']}"}'
    ${item.placeholder ? 'disabled' : ''}
    ${selected ? 'selected' : ''}
    >${item.name}</option>`;
  }

  set range(url) {
    store.list(url).then((list) => {
      this._range = [{ '@id': '', name: this.label, placeholder: true }].concat(
        list,
      );
      this.renderList();
      if (this._value) this.parent.value = `{"@id": "${this._value['@id']}"}`;
    });
  }

  /* eslint-disable-next-line class-methods-use-this */
  get labelTemplate() {
    return '';
  }
}
customElements.define('sib-form-placeholder-dropdown', SIBFormPlaceholderDropdown);
