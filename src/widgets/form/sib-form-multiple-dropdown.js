import { store } from '../../store.js';
import SIBFormMultipleValue from './sib-form-multiple-value.js';

export default class SIBFormMultipleDropdown extends SIBFormMultipleValue {
  getTemplate(item, index) {
    return `<div
      id="id-${this.name}-${index}-box"
      class="${this.tagName}-box"
    >
      <select
        id="id-${this.name}-${index}"
        class="${this.tagName}-input"
        value='${item['@id']}'
        onclick="this.closest('${this.tagName}').updateValue()"
      >${this.optionList}</select>
      <button type="button"
        onclick="this.closest('${
          this.tagName
        }').removeField(${index});return false"
      >&times;</button>
    </div>`;
  }
  getOptionTemplate(item) {
    return `<option value='${item['@id']}'>${item.name}</option>`;
  }
  updateSelected() {
    for (let select of this.querySelectorAll('select'))
      select.value = select.getAttribute('value');
  }
  appendField() {
    super.appendField();
  }
  set range(url) {
    store.list(url).then(list => {
      this.optionList = list.map(item => this.getOptionTemplate(item)).join('');
      this.renderList();
      this.updateSelected();
      this.updateValue();
    });
  }
}
customElements.define('sib-form-multiple-dropdown', SIBFormMultipleDropdown);
