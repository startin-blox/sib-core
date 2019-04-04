import { evalTemplateString } from '../helpers/index.js';
import { store } from '../store.js';

export const widgetFactory = (customTemplate, childTemplate = null, callback = null) => class extends HTMLElement {
  connectedCallback() {
    this.render();
  }
  render() {
    this.innerHTML = evalTemplateString(this.template, {
      src: this.src,
      name: this.name, 
      label: this.label,
      value: this.value, 
      escapedValue: this.escapedValue, 
      range: this.htmlRange,
    });
    if(callback) callback(this)
  }
  get label() {
    return this.getAttribute('label') || this.name;
  }
  set label(label) {
    this.setAttribute('label', label);
    this.render();
  }
  get name() {
    return this.getAttribute('name');
  }
  set name(name) {
    this.setAttribute('name', name);
    this.render();
  }
  get value() {
    if (this.dataHolder) {
      let values = this.dataHolder.map(
        (element => JSON.stringify(element.value) != '{}' ? element.value : this._value || '') // if value is defined, push it in the array
      )
      return values.length == 1 ? values[0] : values // If only one value, do not return an array
    }
    return this._value || '';
  }

  set value(value) {
    if (!this.dataHolder) { // if no dataHolder in the widget...
      this._value = value; // ... store `value` in the widget
      this.render();
    } else if (this.dataHolder.length === 1) { // if one dataHolder in the widget...
      this.dataHolder[0].value = value; // ... set `value` to the dataHolder element
    } else { // if multiple dataHolder in the widget ...
      this.dataHolder.forEach((element, index) => element.value = value ? value[index] : ''); // ... set each `value` to each dataHolder element
    }
  }
  get dataHolder() {
    let widgetDataHolders = [];

    this.querySelectorAll('[data-holder]').forEach((element) => {
      let dataHolderAncestors = element.parentElement.closest('[data-holder]');
      // get the dataHolder of the widget only
      if (!dataHolderAncestors || !this.contains(dataHolderAncestors)) { // if no dataHolder ancestor in the current widget
        widgetDataHolders.push(element);
      }
    })
    return widgetDataHolders.length ? widgetDataHolders : null;
  }

  get template() {
    return customTemplate
  }
  get childTemplate() {
    return childTemplate
  }
  get escapedValue() {
    return ('' + this.value)
      .replace(/&/g, '&amp;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;');
  }

  get range() {
    if (!this._range) return [];
    if (!Array.isArray(this._range)) return [this._range];
    return this._range;
  }
  set range(url) {
    store.list(url).then(list => {
      //this._range = [{ '@id': '', name: '---' }].concat(list);
      this._range = list
      this.render();
      if (this._value) this.value = `{"@id": "${this._value['@id']}"}`;
    });
  }
  get htmlRange() {
    let htmlRange =''
    if (this.range.length) {
      this.range.forEach(element => {
        htmlRange += evalTemplateString(this.childTemplate, {name: element.name, id: element['@id']})
      });
    }
    return htmlRange || ''
  }
};