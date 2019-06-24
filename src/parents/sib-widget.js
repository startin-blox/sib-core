import { widgetFactory } from './widget-factory.js';

export default class SIBWidget extends HTMLElement {
  connectedCallback() {
    widgetFactory(this.name, this.template, this.childTemplate);
  }

  get name() {
    return this.getAttribute('name');
  }

  get template() {
    return this.querySelector('template:not([data-range])').innerHTML;
  }

  get childTemplate() {
    const child = this.querySelector('template[data-range]');
    if (!child) return null;
    return child.innerHTML;
  }
}

customElements.define('sib-widget', SIBWidget);