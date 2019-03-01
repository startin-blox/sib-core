import { widgetFactory } from './widget-factory.js'

export default class SIBWidget extends HTMLElement {
  connectedCallback() {
    customElements.define(this.name, widgetFactory(this.template, this.parentTemplate))
  }

  get name() {
    return this.getAttribute('name');
  }

  get template() {
    return this.querySelector('template:not([data-parent])').innerHTML
  }

  get parentTemplate() {
    let parent = this.querySelector('template[data-parent]')
    return parent ? this.querySelector('template[data-parent]').innerHTML : null
  }
}

customElements.define('sib-widget', SIBWidget);
