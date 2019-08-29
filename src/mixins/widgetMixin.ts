import { store } from '../libs/store/store.js';
import { parseFieldsString, findClosingBracketMatchIndex } from '../libs/helpers.js';

const WidgetMixin = {
  name: 'widget-mixin',
  use: [],
  attributes: {
    fields: {
      type: String,
      default: null,
    }
  },
  initialState: {
    widgets: null,
    _div: null
  },
  created(): void {
    this.widgets = [];
  },
  attached(): void {
    if (!this.dataSrc && !this.resource) this.populate();
  },
  get div(): HTMLElement {
    if (this._div) return this._div;
    this._div = document.createElement('div');
    this.element.appendChild(this._div);
    return this._div;
  },
  set div(value) {
    this._div = value
  },
  get fieldsWidget(): string[][] {
    const attr = this.fields as string;
    if (attr === '') {
      return [];
    }
    if (attr) {
      return parseFieldsString(attr);
    }
    const resource =
      this.isContainer() && this.resources ? this.resources[0] : this.resource;

    if (!resource) {
      console.error(new Error('You must provide a "fields" attribute'));
      return [];
    }

    return Object.keys(resource)
      .filter(prop => !prop.startsWith('@'))
      .map(a => [a]);
  },
  getAction(field: string): string {
    const action = this.element.getAttribute('action-' + field);
    return action;
  },
  getSetRegexp(field: string) {
    return new RegExp(`(^|\\,|\\(|\\s)\\s*${field}\\s*\\(`, 'g')
  },
  getSet(field: string): string[][] {
    const setString = this.fields.match(this.getSetRegexp(field));
    if (!setString) return [];
    const firstSetBracket = this.fields.indexOf(setString[0]) + (setString[0].length) - 1;
    const lastSetBracket = findClosingBracketMatchIndex(this.fields, firstSetBracket);
    const set = this.fields.substring(firstSetBracket + 1, lastSetBracket);
    return parseFieldsString(set);
  },
  isSet(field: string): boolean {
    if (!this.fields) return false;
    let foundSets = this.fields.match(this.getSetRegexp(field));
    return foundSets ? foundSets.length > 0 : false;
  },
  isMultiple(field:string): boolean {
    return this.element.hasAttribute('multiple-' + field);
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
    const escapedField = this.getEscapedField(field);
    if (this.getAction(escapedField)) {
      return this.getAction(escapedField);
    }
    if (this.element.hasAttribute('value-' + field)) {
      return this.element.getAttribute('value-' + field);
    }
    let resource = this.resource || {};
    for (let name of field) {
      resource = await this.fetchValue(resource, name);
      if (resource == null || resource == "") // If null or empty, return field default value
        return this.element.hasAttribute('default-' + field) ?
          this.element.getAttribute('default-' + field) : undefined;
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
  empty(): void {
    // create a new empty div next to the old one
    if (this._div) {
      let newDiv = document.createElement('div')
      this.element.insertBefore(newDiv, this._div)
      this.element.removeChild(this._div)
      this.div = newDiv
    }
  },
  getWidget(field: string): string {
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
  async widgetAttributes(field: string): Promise<object> {
    const attrs = {
      name: field,
    };
    const escapedField = this.getEscapedField(field);
    for (let attr of ['range', 'label', 'class']) {
      const value = this.element.getAttribute(`each-${attr}-${escapedField}`);
      if (value == null) continue;
      attrs[`each-${attr}`] = value;
    }
    for (let attr of ['range', 'label', 'class', 'widget', 'editable', 'upload-url']) {
      const value = this.element.getAttribute(`${attr}-${escapedField}`);
      if (value == null) continue;
      if (attr === 'class') attr = 'className';
      if(attr === 'upload-url') attr = 'uploadURL';
      attrs[attr] = value;
    }
    for (let attr of ['add-label', 'remove-label']) {
      const value = this.element.getAttribute(`multiple-${escapedField}-${attr}`);
      if (value == null) continue;
      attrs[attr] = value;
    }
    if (this.getAction(escapedField) && this.resource) attrs['src'] = this.resource['@id'];
    attrs['value'] = await this.getValues(field);
    attrs['resourceId'] = this.resource ? this.resource['@id'] : null;

    return attrs;
  },
  async appendWidget(field: string, parent: HTMLElement): Promise<void> {
    if (!parent) parent = this.div;
    if (this.isSet(field)) {
      await this.appendSet(field, parent);
      return;
    }

    const attributes = await this.widgetAttributes(field);

    const escapedField = this.getEscapedField(field);
    const tagName = this.multiple(escapedField) || this.getWidget(escapedField);
    const widget = document.createElement(tagName);
    if (this.multiple(escapedField)) {
      widget.setAttribute('widget', this.getWidget(escapedField));
    }

    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }

    this.widgets.push(parent.appendChild(widget));
  },
  multiple(field: string): string | null {
    const attribute = 'multiple-' + field;
    if (!this.element.hasAttribute(attribute)) return null;
    return this.element.getAttribute(attribute) || this.defaultMultipleWidget;
  },

  async appendSet(field: string, parent: Element): Promise<void> {
    const widget = document.createElement(this.element.getAttribute('widget-' + field) || this.defaultSetWidget);
    widget.setAttribute('name', field);
    parent.appendChild(widget);
    setTimeout(async () => {
      const parentNode = widget.querySelector('[data-content]') || widget;
      for (let item of this.getSet(field)) {
        await this.appendWidget(item, parentNode);
      }
    })
  },
  /**
   * Returns field name without starting "@"
   * @param field
   */
  getEscapedField(field: string[]): string[] {
    return field.map(prop => prop.startsWith('@') ? prop.slice(1, prop.length) : prop);
  }
}

export {
  WidgetMixin
}