import mix from './helpers/mixin.js';
import bindAttributes from './helpers/mixin/attributes/bind.js';
import ElementFactory from './Core/Element.js';

export default class SIB {
  static register(element, selector = null) {
    const customElement = this.build(element);
    customElements.define(selector || element.selector, customElement);
  }

  static build(element) {
    const patchedElement = mix(element);
    return ElementFactory(patchedElement);
  }
}
