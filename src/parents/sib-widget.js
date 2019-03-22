import { uniqID } from '../helpers/index.js';

export default class SIBWidget extends HTMLElement {
  connectedCallback() {
    this.render();
  }
  static get observedAttributes() {return ['data-value']; }

  render() {
    this.innerHTML = this.template;
  }
  get label() {
    return this.getAttribute('label') || this.name;
  }
  set label(label) {
    this.setAttribute('label', label);
    this.render();
  }
  get name() {
    return this.getAttribute('name');
  }
  set name(name) {
    this.setAttribute('name', name);
    this.render();
  }
  get value() {
    return this.getAttribute('data-value');
  }
  set value(value) {
    // this.setAttribute('data-value', value);
    this.render();
  }
  attributeChangedCallback(attribute, oldValue, newValue) {
    console.log({ attribute, oldValue, newValue });
    if (attribute === 'data-value') {
      this.value = newValue;
    }
  }
  get escapedValue() {
    return ('' + this.value)
      .replace(/&/g, '&amp;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;');
  }
}
