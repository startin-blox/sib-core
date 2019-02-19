import SIBWidget from './sib-widget.js';
import { uniqID } from '../helpers/index.js';

export default class SIBMultipleWidget extends SIBWidget {
  // eslint-disable-next-line class-methods-use-this
  get parentTag() {
    return 'div';
  }

  get labelTemplate() {
    if (!this.id) this.id = uniqID();
    return `<label for="${this.id}">${this.label}</label>`;
  }

  emptyList() {
    while (this.parent.firstChild) this.parent.removeChild(this.parent.firstChild);
  }

  renderList() {
    this.emptyList();
    // add one instance of the template per item in the value array
    this.parent.innerHTML = this.values.map(this.getTemplate, this).join('');
  }

  render() {
    this.innerHTML = this.labelTemplate;
    this.parent = document.createElement(this.parentTag);
    this.parent.setAttribute('name', this.name);
    this.appendChild(this.parent);
    this.renderList();
  }

  get values() {
    if (!this.value) return [];
    let { value } = this;
    if ('ldp:contains' in value) value = value['ldp:contains'];
    if (!Array.isArray(value)) value = [value];
    return value;
  }
}
