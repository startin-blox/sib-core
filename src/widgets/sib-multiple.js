import { BaseWidget } from './widget-factory.js';

export default class SIBMultiple extends BaseWidget {
  render() {
    while (this.firstChild) this.firstChild.remove();

    const label = document.createElement('label');
    label.textContent = this.label;
    this.appendChild(label);
    if (!this.value) return;
    this.value.forEach(value => {
      const elm = this.insertWidget(this.childAttributes);
      elm.value = value;
      elm.toggleAttribute('data-holder', true);
    });
  }

  get childAttributes() {
    const attrs = {};

    for (let attr of ['label', 'class']) {
      const value = this[`each-${attr}`];
      if (value == null) continue;
      attrs[attr] = value;
    }

    attrs.name = this.name;

    return attrs;
  }

  insertWidget(attributes) {
    const widget = document.createElement(this.getAttribute('widget'));
    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }
    this.appendChild(widget);
    return widget;
  }
}
customElements.define('sib-multiple', SIBMultiple);
