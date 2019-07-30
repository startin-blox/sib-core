import { BaseWidget } from './widget-factory.js';
import { defineComponent } from "../libs/helpers.js";

export default class SIBMultipleSelect extends BaseWidget {
  get range(): string | null {
    return this.getAttribute('range');
  }
  set range(range: string | null) {
    if (range) this.setAttribute('range', range);
    if (this.firstChild) this.firstChild['range'] = range;
  }

  render(): void {
    if (!this.firstChild) this.insertWidget(this.attributes);
    if (this.firstChild) {
      if (this.label) this.firstChild['label'] = this.label;
      if (this.value) this.firstChild['value'] = this.value;
      (this.firstChild as Element).toggleAttribute('data-holder', true);
    }
  }

  get attributes(): any {
    const attrs = {};
    if (this.range) attrs['range'] = this.range;
    if (this.label) attrs['label'] = this.label;
    attrs['name'] = this.name;
    attrs['multiple'] = true;

    return attrs;
  }

  get value(): object[] {
    return this.firstChild ? this.firstChild['value'] : null;
  }
  set value(value) {
    if(this.firstChild) this.firstChild['value'] = value;
  }

  insertWidget(attributes: object): HTMLElement | undefined {
    const widgetTag = this.getAttribute('widget');
    const widget = widgetTag ? document.createElement(widgetTag) : null;
    if (!widget) return;

    // Override getter and setter of widget
    Reflect.defineProperty(widget, 'value', {
      get: function () {
        if (this.querySelectorAll('select option:checked').length) {
          const options = this.querySelectorAll('select option:checked') as NodeListOf<HTMLOptionElement>;
          return Array.from(options).map(el => JSON.parse(el.value));
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

defineComponent('sib-multiple-select', SIBMultipleSelect);
