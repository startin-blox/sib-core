import { evalTemplateString } from '../helpers/index.js';

class BaseWidget extends HTMLElement{
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
}

export default class SIBWidgetFactory extends HTMLElement {
  connectedCallback() {
    BaseWidget.prototype.template = this.querySelector('template').innerHTML
    customElements.define(this.name, BaseWidget);
  }

  get name() {
    return this.getAttribute('name');
  }
}

customElements.define('sib-widget-factory', SIBWidgetFactory);
