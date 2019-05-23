import { BaseWidget } from '../parents/widget-factory.js';

export default class SIBMultipleSelect extends BaseWidget {
  get range() {
    return this.getAttribute('range');
  }
  set range(range) {
    this.setAttribute('range', range);
  }

  render() {
    while (this.firstChild) this.firstChild.remove();

    const elm = this.insertWidget(this.attributes);
    elm.value = this.value;
    elm.toggleAttribute('data-holder', true);
  }

  get attributes() {
    const attrs = {};
    if (this.range) attrs.range = this.range;
    if (this.label) attrs.label = this.label;
    attrs.name = this.name;
    attrs.multiple = true;

    return attrs;
  }

  get value() {
    return Array.from(this.querySelectorAll('select option:checked')).map(el => ({ "@id": el.value }));
  }
  set value(values) {
    this.querySelectorAll('select option').forEach(element => element.selected = false); // unselect all options...
    values.forEach(value => this.querySelector(`select option[value="${value}"]`).selected = true); // ... and select only "values"
    this.querySelector('select').dispatchEvent(new Event('change')); // ... finally trigger change
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
customElements.define('sib-multiple-select', SIBMultipleSelect);
