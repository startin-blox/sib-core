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

  async render() {
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
        const options = Array.from(document.querySelectorAll('select option'));
        const selectedOptions = options.filter(el => el['selected']);
        if (selectedOptions.length) {
          return selectedOptions.map(el => el['value'] ? JSON.parse(el['value']) : null);
        }
        return options.length ? [] : (this._value || ''); // if options in DOM, return nothing selected. Else return original value
      },
      set: function (values) {
        (async () => {
          this._value = values
          const selectElement = this.querySelector('select');
          if (!selectElement) return;
          selectElement.querySelectorAll('option').forEach(element => element.selected = false); // unselect all options...
          if (selectElement && values) {
            for await (let value of values['ldp:contains']) {
              const selectedValue = value['@id'];
              const selectedElement = selectElement.querySelector(`option[value='{"@id": "${selectedValue}"}']`);
              if (selectedElement) selectedElement.selected = true;
            }
            selectElement.dispatchEvent(new Event('change')); // ... finally trigger change
          }
        })();
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
