import { store } from '../../store.js';
import { SIBMultipleWidget } from '../../parents/index.js';

export class SIBFormDropdown extends SIBMultipleWidget {
  get parentTag() {
    return 'select';
  }
  getTemplate(item, index) {
    const selected = this.value == item['@id'] ? 'selected' : '';
    return `<option
      value='{"@id": "${item['@id']}"}'
      ${selected}
    >${item.name}</option>`;
  }
  get values() {
    if (!this._range) return [];
    if (!Array.isArray(this._range)) return [this._range];
    return this._range;
  }
  set range(url) {
    store.list(url).then(list => {
      this._range = [{ '@id': '', name: '---' }].concat(list);
      this.renderList();
      if (this._value) this.parent.value = `{"@id": "${this._value['@id']}"}`;
    });
  }
  render() {
    super.render();
    this.parent.id = this.id;
  }
}
customElements.define('sib-form-dropdown', SIBFormDropdown);
