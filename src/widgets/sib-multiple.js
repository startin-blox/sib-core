import { Widget } from '../parents/widget-factory.js';

export default class SIBMultiple extends Widget {
  constructor() {
    super();
    this.widgets = [];
  }

  get name() {
    return this.getAttribute('name');
  }

  set name(name) {
    this.setAttribute('name', name);
  }

  get value() {
    return this.widgets.map(widget => widget.value);
  }

  set value(values) {
    while (this.firstChild) this.firstChild.remove();
    values.forEach(value => {
      const elm = this.insertWidget(this.childAttributes);
      elm.value = value;
    });
  }
  get childAttributes() {
    const attrs = {};
    Array.from(this.attributes)
      .filter(a => a.specified && a.name.startsWith('each-'))
      .forEach(a => {
        attrs[a.name] = a.textContent;
      });
    return attrs;
  }

  insertWidget(attributes) {
    const widget = document.createElement(this.getAttribute('widget'));
    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }
    this.appendChild(widget);
    this.widgets.push(widget);
    return widget;
  }
}
customElements.define('sib-multiple', SIBMultiple);
