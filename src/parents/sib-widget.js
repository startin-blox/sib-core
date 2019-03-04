import { widgetFactory } from './widget-factory.js'

export default class SIBWidget extends HTMLElement {
  connectedCallback() {
    customElements.define(this.name, widgetFactory(this.template, this.childTemplate))
  }

  get name() {
    return this.getAttribute('name');
  }

  get template() {
    return this.querySelector('template:not([data-range])').innerHTML
  }

  get childTemplate() {
    let child = this.querySelector('template[data-range]')
    return child ? this.querySelector('template[data-range]').innerHTML : null
  }
}

customElements.define('sib-widget', SIBWidget);
