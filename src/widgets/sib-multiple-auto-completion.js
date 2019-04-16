import { BaseWidget } from '../parents/widget-factory.js';
import { importCSS } from '../helpers/index.js';
import Choices from 'https://dev.jspm.io/choices.js@4';

export default class SIBMultipleAutoCompletion extends BaseWidget {
  constructor() {
    super();
    this.choicesElement;
  }
  get template() {
    return `
    <label>
      <div>\${label}</div>
      <select name="\${name}" data-holder multiple>
        \${range}
      </select>
    </label>
    `
  }
  get childTemplate() {
    return `
    <option value="\${id}">\${name}</option>
    `
  }
  get value() {
    return this.choicesElement ? this.choicesElement.getValue(true) : '';
  }
  set value(values) {
    if (this.choicesElement) {
      this.choicesElement.removeActiveItems();
      this.choicesElement.setChoiceByValue(values);
    }
  }
  render() {
    super.render();
    let select = this.querySelector('select');
    if (!select) return;
    this.choicesElement = new Choices(select, { removeItemButton: true });
    importCSS('https://dev.jspm.io/npm:choices.js@4/public/assets/styles/choices.min.css');
  }
}
customElements.define('sib-multiple-auto-completion', SIBMultipleAutoCompletion);
