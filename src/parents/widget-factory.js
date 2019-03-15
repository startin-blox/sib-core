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
    return (this.dataHolder && JSON.stringify(this.dataHolder.value) != "{}") // if dataHolder is not an empty object
      ? this.dataHolder.value
      : this._value || ''
  }
  set value(value) {
    if (this.dataHolder) {
      this.dataHolder.value = value
    } else {
      this._value = value
      this.render()
    }
  }
  get dataHolder() {
    return this.querySelector('[data-holder]')
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