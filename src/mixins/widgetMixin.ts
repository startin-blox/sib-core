import { parseFieldsString, findClosingBracketMatchIndex } from '../libs/helpers.js';
import { newWidgetFactory } from '../new-widgets/new-widget-factory.js';

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
      if (!prop.startsWith('@') && await resource[prop]) fields.push(prop);
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
    if (resourceValue === undefined || resourceValue === "") // If null or empty, return field default value
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
  getWidget(field:string):string {
    const widget = this._getWidget(field)
    if(!this.element.localName.startsWith('sib-')) 
      return widget;
    return widget.replace(/^solid-/, 'sib-');
  },
  _getWidget(field: string): object {
    const widget = this.element.getAttribute('widget-' + field);
    if (widget) {
      let type = 'custom';
      if (!customElements.get(widget)) { // component does not exist
        if (widget.startsWith('solid')) newWidgetFactory(widget); // solid- -> create it
        else type = 'native'; // or use a native tag
      }
      return { tagName: widget, type }; // return tagName
    }
    if (this.getAction(field)) return {tagName: 'solid-action', type: 'custom'};
    return {tagName: this.defaultWidget, type: 'custom'};
  },
  widgetAttributes(field: string): object {
    const attrs = {
      name: field,
      context: this.context
    };
    const escapedField = this.getEscapedField(field);
    for (let attr of ['range', 'label', 'placeholder', 'class']) {
      const value = this.element.getAttribute(`each-${attr}-${escapedField}`);
      if (value == null) continue;
      attrs[`each-${attr}`] = value;
    }
    for (let attr of ['range', 'label','placeholder', 'class', 'widget', 'editable', 'upload-url']) {
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

    return attrs;
  },
  createWidget(field: string): Element {
    if (!parent) parent = this.div;
    if (this.isSet(field)) {
      return this.createSet(field);
    }

    const attributes = this.widgetAttributes(field);

    const escapedField = this.getEscapedField(field);
    const widgetMeta = this.multiple(escapedField) || this.getWidget(escapedField);
    const widget = document.createElement(widgetMeta.tagName);
    if (this.multiple(escapedField)) {
      widget.setAttribute('widget', this.getWidget(escapedField).tagName);
    }

    if (widgetMeta.type == 'native') {
      this.getValue(field).then(value => {
        widget.innerHTML = value;
      });
    } else {
      for (let name of Object.keys(attributes)) {
        widget.setAttribute(name, attributes[name]);
      }

      this.getValue(field).then(value => {
        widget.setAttribute('value',value);
        if (value && value['@id']) {
          PubSub.subscribe(value['@id'], () => this.updateDOM())
          // TODO : remove subscriptions
        }
      });
    }

    this.widgets.push(widget);
    return widget;
  },
  multiple(field: string): string | null {
    const prefix = this.element.localName.split('-').shift() === 'sib' ? 'sib': 'solid';
    const attribute = 'multiple-' + field;
    if (!this.element.hasAttribute(attribute)) return null;
    return this.element.getAttribute(attribute) || this.defaultMultipleWidget.replace(/^solid/, prefix);
  },

  createSet(field: string): Element {
    const prefix = this.element.localName.split('-').shift() === 'sib' ? 'sib': 'solid';
    const widget = document.createElement(
      this.element.getAttribute('widget-' + field) || this.defaultSetWidget.replace(/^solid/, prefix),
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