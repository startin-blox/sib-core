import { evalTemplateString } from '../helpers/index.js';

const widgetClass = (customTemplate) => class extends HTMLElement {
  connectedCallback() {
    this.render();
  }
  render() {
    this.innerHTML = evalTemplateString(this.template, { name: this.name, value: this.value });
  }
  get name() {
    return this.getAttribute('name');
  }
  set name(name) {
    this.setAttribute('name', name);
    this.render();
  }
  get value() {
    return this._value || '';
  }
  set value(value) {
    this._value = value;
    this.render();
  }
  get template() {
    return customTemplate
  }
};

export default class SIBWidgetFactory extends HTMLElement {
  connectedCallback() {
    customElements.define(this.name, widgetClass(this.getTemplate()))
  }

  get name() {
    return this.getAttribute('name');
  }

  getTemplate() {
    return this.querySelector('template').innerHTML
  }
}

customElements.define('sib-widget-factory', SIBWidgetFactory);
