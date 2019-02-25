import { evalTemplateString } from '../helpers/index.js';

export const widgetFactory = (customTemplate) => class extends HTMLElement {
  connectedCallback() {
    this.render();
  }
  render() {
    this.innerHTML = evalTemplateString(this.template, { name: this.name, value: this.value, label: this.label, escapedValue: this.escapedValue });
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
    return (this.dataHolder && JSON.stringify(this.dataHolder.value) != JSON.stringify({})) // if dataHolder is not an empty object
      ? this.dataHolder.value
      : this._value || ''
  }
  set value(value) {
    if (this.dataHolder) {
      this.dataHolder.value = value
    } else {
      this._value = value
      this.render()
    }
  }
  get template() {
    return customTemplate
  }
  get escapedValue() {
    return ('' + this.value)
      .replace(/&/g, '&amp;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;');
  }
  get dataHolder() {
    return this.querySelector('[data-holder]')
  }
};