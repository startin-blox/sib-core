export default class SIBMultiple extends HTMLElement {
  render() {}
  get name() {
    return this.getAttribute('name');
  }

  set name(name) {
    this.setAttribute('name', name);
  }

  get value() {
    return this.widgets.map(widget => widget.value);
  }
}
customElements.define('sib-multiple', SIBMultiple);
