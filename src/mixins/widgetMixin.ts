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
  async getFields(): Promise<string[]>{ // TODO : improve code
    const attr = this.fields;
    if (attr === '') return [];
    if (attr) return parseFieldsString(attr);

    let resource = this.resource;
    if (resource && await resource.isContainer()) { // If container, keep the 1rst resource
      for await (let res of resource['ldp:contains']) {
        resource = res;
        break;
      }
    }

    if (!resource) {
      console.error(new Error('You must provide a "fields" attribute'));
      return [];
    }

    let fields: string[] = [];
    for await (const prop of resource.properties) {
      if (!prop.startsWith('@')) fields.push(prop);
    }
    return fields;
  },
  getAction(field: string): string {
    const action = this.element.getAttribute('action-' + field);
    return action;
  },
  getSetRegexp(field: string) {
    return new RegExp(`(^|\\,|\\(|\\s)\\s*${field}\\s*\\(`, 'g')
  },
  getSet(field: string): string[] {
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
    return this.resource && !(await this.resource.isContainer()) ? await resource[field] : undefined;
  },
  async getValue(field: string) {
    const escapedField = this.getEscapedField(field);
    if (this.getAction(escapedField)) {
      return this.getAction(escapedField);
    }
    if (this.element.hasAttribute('value-' + field)) {
      return this.element.getAttribute('value-' + field);
    }
    let resourceValue = await this.fetchValue(this.resource, field);
    if (resourceValue == undefined || resourceValue == "") // If null or empty, return field default value
      return this.element.hasAttribute('default-' + field) ?
        this.element.getAttribute('default-' + field) : undefined;
    return resourceValue;
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
  widgetAttributes(field: string): object {
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
    attrs['resourceId'] = this.resource ? this.resource['@id'] : null;
    attrs['context'] = this.context;

    return attrs;
  },
  createWidget(field: string): Element {
    if (!parent) parent = this.div;
    if (this.isSet(field)) {
      return this.createSet(field);
    }

    const attributes = this.widgetAttributes(field);

    const escapedField = this.getEscapedField(field);
    const tagName = this.multiple(escapedField) || this.getWidget(escapedField);
    const widget = document.createElement(tagName);
    if (this.multiple(escapedField)) {
      widget.setAttribute('widget', this.getWidget(escapedField));
    }

    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }

    this.widgets.push(widget);
    this.getValue(field).then(value => widget.value = value);
    return widget;
  },
  multiple(field: string): string | null {
    const attribute = 'multiple-' + field;
    if (!this.element.hasAttribute(attribute)) return null;
    return this.element.getAttribute(attribute) || this.defaultMultipleWidget;
  },

  createSet(field: string): Element {
    const widget = document.createElement(
      this.element.getAttribute('widget-' + field) || this.defaultSetWidget,
    );
    widget.setAttribute('name', field);
    setTimeout(async () => {
      const parentNode = widget.querySelector('[data-content]') || widget;
      for (let item of this.getSet(field)) {
        parentNode.appendChild(this.createWidget(item));
      }
    });
    return widget;
  },
  /**
   * Returns field name without starting "@"
   * @param field
   */
  getEscapedField(field: string): string {
    return field.startsWith('@') ? field.slice(1, field.length) : field;
  }
}

export {
  WidgetMixin
}