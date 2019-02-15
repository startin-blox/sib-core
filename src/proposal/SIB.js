export default class SIB {
  static register(element, selector = null) {
    customElements.define(selector || element.selector, element);
  }
}
