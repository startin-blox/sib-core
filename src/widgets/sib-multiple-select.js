import { BaseWidget } from '../parents/widget-factory.js';

export default class SIBMultipleSelect extends BaseWidget {
  get range() {
    return this.getAttribute('range');
  }
  set range(range) {
    this.setAttribute('range', range);
    this.firstChild.range = range;
  }

  render() {
    if(!this.firstChild) this.insertWidget(this.attributes);
    if(this.value) this.firstChild.value = this.value;
    this.firstChild.toggleAttribute('data-holder', true);
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
    return this.firstChild ? this.firstChild.value : null;
  }
  set value(value) {
    this.firstChild.value = value;
  }

  insertWidget(attributes) {
    const widget = document.createElement(this.getAttribute('widget'));

    // Override getter and setter of widget
    Reflect.defineProperty(widget, 'value', {
      get: function () {
        if (this.querySelectorAll('select option:checked').length) {
          return Array.from(this.querySelectorAll('select option:checked')).map(el => JSON.parse(el.value));
        }
        return this._value || '';
      },
      set: function (values) {
        this._value = values
        const selectElement = this.querySelector('select');
        selectElement.querySelectorAll('option').forEach(element => element.selected = false); // unselect all options...
        if (selectElement && values) {
          values.forEach(value => { // ... and select only "values"
            const selectedValue = value.hasOwnProperty('@id') ? value['@id'] : value;
            const selectedElement = selectElement.querySelector(`option[value='{"@id": "${selectedValue}"}']`);
            if (selectedElement) selectedElement.selected = true
          });
          selectElement.dispatchEvent(new Event('change')); // ... finally trigger change
        }
      }
    });

    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }

    this.appendChild(widget);
    return widget;
  }
}
customElements.define('sib-multiple-select', SIBMultipleSelect);
