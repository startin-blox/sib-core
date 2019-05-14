import { store } from '../store.js';
import { parseFieldsString } from '../helpers/index.js';

const WidgetMixin = {
  name: 'widget-mixin',
  use: [],
  attributes: {
    dataFields: {
      type: String,
      default: '',
    }
  },
  initialState: {
    widgets: [],
    wrappers: {},
    div: null
  },
  attached() {
    // TODO : super. ?
    if (!this.element.dataset.src && !this.resource) this.populate();
  },
  getDiv() {
    if (this.div) return this.div;
    this.div = document.createElement('div');
    this.element.appendChild(this.div);
    return this.div;
  },
  getSet(field: string) {
    return parseFieldsString(this.element.getAttribute('set-' + field));
  },
  getAction(field: string) {
    const action = this.element.getAttribute('action-' + field);
    return action;
  },
  isMultiple(field:string) {
    return this.element.hasAttribute('multiple-' + field);
  },
  isSet(field: string) {
    return this.element.hasAttribute('set-' + field);
  },
  getFields() {
    if (this.dataFields === '') {
      return [];
    }
    if (this.dataFields) {
      return parseFieldsString(this.dataFields);
    }

    const resource =
      this.isContainer() && this.resources ? this.resources[0] : this.resource;

      if (!resource) {
        console.error(new Error('You must provide a "data-fields" attribute'));
        return [];
      }

    return Object.keys(resource)
      .filter(prop => !prop.startsWith('@'))
      .map(a => [a]);
  },
  async fetchValue(resource, field: string) {
    if (this.isContainer()) return null;
    if (!(field in resource) && '@id' in resource) {
      resource = await store.get(resource, this.context);
    }
    if (!(field in resource)) {
      resource[field] = undefined;
    }
    return resource[field];
  },
  async getValue(field: string) {
    if (this.getAction(field)) {
      return this.getAction(field);
    }
    if (this.element.hasAttribute('value-' + field)) {
      return this.element.getAttribute('value-' + field);
    }
    let resource = this.resource;
    for (let name of field) {
      resource = await this.fetchValue(resource, name);
      if (resource == null) return;
    }
    return resource;
  },
  async getValues(field: string) {
    let value = await this.getValue(field);
    if (!this.isMultiple(field)) return value;
    if (value == null) return [];
    if (value['@type'] !== 'ldp:Container') {
      return [value];
    }
    if (!('ldp:contains' in value)) return [];
    value = value['ldp:contains'];
    if (!Array.isArray(value)) value = [value];
    value = await Promise.all(value.map(a => store.get(a)));
    return value;
  },
  empty() {
    // create a new empty div next to the old one
    if (this.div) {
      let newDiv = document.createElement('div')
      this.element.insertBefore(newDiv, this.div)
      this.element.removeChild(this.div)
      this.div = newDiv
    }
  },
  getWidget(field: string) {
    const widget = this.element.getAttribute('widget-' + field);
    if (widget) {
      if (!customElements.get(widget)) {
        console.warn(`The widget ${widget} is not defined`);
      }
      return widget;
    }
    if (this.getAction(field)) return 'sib-action';
    return this.defaultWidget;
  },
  async widgetAttributes(field: string) {
    const attrs = {
      name: field,
    };
    for (let attr of ['range', 'label', 'class']) {
      const value = this.element.getAttribute(`each-${attr}-${field}`);

      if (value == null) continue;
      attrs[`each-${attr}`] = value;
    }
    for (let attr of ['range', 'label', 'class', 'widget']) {
      const value = this.element.getAttribute(`${attr}-${field}`);
      if (value == null) continue;
      if (attr === 'class') attr = 'className';
      attrs[attr] = value;
    }
    if (this.getAction(field)) attrs['src'] = this.resource['@id'];
    attrs['value'] = await this.getValues(field);

    return attrs;
  },
  async appendWidget(field: string, parent: HTMLElement) {
    if (!parent) parent = this.getDiv();
    if (this.isSet(field)) {
      await this.appendSet(field, parent);
      return;
    }

    const attributes = await this.widgetAttributes(field);

    const tagName = this.multiple(field) || this.getWidget(field);
    const widget = document.createElement(tagName);
    if (this.multiple(field)) {
      widget.setAttribute('widget', this.getWidget(field));
    }

    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }

    this.widgets.push(parent.appendChild(widget));
  },


  multiple(field: string) {
    const attribute = 'multiple-' + field;
    if (!this.element.hasAttribute(attribute)) return null;
    return this.element.getAttribute(attribute) || this.defaultMultipleWidget;
  },

  async appendSet(field: string, parent) {
    const div = document.createElement('div');
    div.setAttribute('name', field);
    parent.appendChild(div);
    for (let item of this.getSet(field)) {
      await this.appendWidget(item, div);
    }
  }
}

export {
  WidgetMixin
}