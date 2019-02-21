import { widgetFactory } from './widget-factory.js'

export default class SIBWidget extends HTMLElement {
  connectedCallback() {
    customElements.define(this.name, widgetFactory(this.template))
  }

  get name() {
    return this.getAttribute('name');
  }

  get template() {
    return this.querySelector('template').innerHTML
  }
}

customElements.define('sib-widget', SIBWidget);
