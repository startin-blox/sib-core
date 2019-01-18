import { store } from '../../store.js';
import { importCSS } from '../../helpers/index.js';
import { SIBMultipleWidget } from '../../parents/index.js';
import Choices from 'https://dev.jspm.io/choices.js@4';

export class SIBFormAutoCompletion extends SIBMultipleWidget {
  constructor() {
    super();
    this.list = [];
  }
  async renderList() {
    const select = document.createElement('select');
    select.multiple = true;
    const options = this.list.map(value => {
      const option = document.createElement('option');
      option.value = value['@id'];
      option.textContent = value.name;
      return option;
    });
    this.values.forEach(value => {
      const option = options.find(option => {
        const ret = option.value === value['@id'];
        return ret;
      });
      if (option) option.selected = true;
    });
    options.forEach(option => select.appendChild(option));
    this.parent.appendChild(select);
    new Choices(select, { removeItemButton: true });
    importCSS('https://dev.jspm.io/npm:choices.js@4/public/assets/styles/choices.min.css')
  }
  set range(url) {
    store.list(url).then(list => {
      this.list = list;
      this.render();
    });
  }
}

customElements.define('sib-form-auto-completion', SIBFormAutoCompletion);
