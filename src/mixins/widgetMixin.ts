import { parseFieldsString, findClosingBracketMatchIndex } from '../libs/helpers.js';
import { newWidgetFactory } from '../new-widgets/new-widget-factory.js';
import { WidgetInterface, WidgetType, Resource } from './interfaces.js';

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
  /**
   * Return field list of the component
   */
  async getFields(): Promise<string[]>{ // TODO : improve code
    const attr = this.fields;
    if (attr === '') return [];
    if (attr) return parseFieldsString(attr);

    let resource = this.resource as Resource;
    if (resource && resource.isContainer()) { // If container, keep the 1rst resource
      for (let res of resource['ldp:contains']) {
        resource = res;
        break;
      }
    }

    if (!resource) {
      console.error(new Error('You must provide a "fields" attribute'));
      return [];
    }

    let fields: string[] = [];
    for (const prop of resource.properties) {
      if (!prop.startsWith('@') && await resource[prop]) fields.push(prop);
    }
    return fields;
  },
  /**
   * return attribute if "field" is an action
   * @param field - string
   */
  getAction(field: string): string {
    const action = this.element.getAttribute('action-' + field);
    return action;
  },
  /**
   * return true if "field" is editable
   * @param field - string
   */
  editable(field: string): string {
    return this.element.hasAttribute('editable-' + field);
  },
  /**
   * Return regexp to check if "field" is a set
   * @param field - string
   */
  getSetRegexp(field: string) {
    return new RegExp(`(^|\\,|\\(|\\s)\\s*${field}\\s*\\(`, 'g')
  },
  /**
   * Return fields contained in set "field"
   * @param field - string
   */
  getSet(field: string): string[] {
    const setString = this.fields.match(this.getSetRegexp(field));
    if (!setString) return [];
    const firstSetBracket = this.fields.indexOf(setString[0]) + (setString[0].length) - 1;
    const lastSetBracket = findClosingBracketMatchIndex(this.fields, firstSetBracket);
    const set = this.fields.substring(firstSetBracket + 1, lastSetBracket);
    return parseFieldsString(set);
  },
  /**
   * Return true if "field" is a set
   * @param field - string
   */
  isSet(field: string): boolean {
    if (!this.fields) return false;
    let foundSets = this.fields.match(this.getSetRegexp(field));
    return foundSets ? foundSets.length > 0 : false;
  },
  /**
   * Return the value of "resource" for predicate "field"
   * @param resource - Resource
   * @param field - string
   */
  async fetchValue(resource: Resource, field: string) {
    return this.resource && !this.resource.isContainer() ? await resource[field] : undefined;
  },
  /**
   * Return the value of the field
   * @param field - field
   */
  async getValue(field: string) {
    const escapedField = this.getEscapedField(field);
    if (this.getAction(escapedField)) {
      return this.getAction(escapedField);
    }
    if (this.element.hasAttribute('value-' + field)) {
      return this.element.getAttribute('value-' + field);
    }
    let resourceValue = await this.fetchValue(this.resource, field);

    // Empty value
    if (resourceValue === undefined || resourceValue === '') // If null or empty, return field default value
      return this.element.hasAttribute('default-' + field) ?
        this.element.getAttribute('default-' + field) : '';

    return resourceValue;
  },
  /**
   * Clear the component
   */
  empty(): void {
    // create a new empty div next to the old one
    if (this._div && document.contains(this._div)) { // execute only if _div is used (for lists)
      let newDiv = document.createElement('div');
      this.element.insertBefore(newDiv, this._div);
      this.element.removeChild(this._div);
      this.div = newDiv;
    }
  },
  /**
   * Return a widget from a tagName, and create it if necessary
   * @param tagName - string
   */
  widgetFromTagName(tagName: string) {
    let type = tagName.startsWith('solid') ? WidgetType.CUSTOM : WidgetType.USER;
    if (!customElements.get(tagName)) { // component does not exist
      if (tagName.startsWith('solid')) newWidgetFactory(tagName); // solid- -> create it
      else type = WidgetType.NATIVE; // or use a native tag
    }
    return { tagName, type }; // return tagName
  },
  /**
   * Return widget for field "field"
   * @param field - string
   * @param isSet - boolean
   */
  getWidget(field: string, isSet: boolean = false): WidgetInterface {
    const widget = this.element.getAttribute('widget-' + field);

    if (widget) return this.widgetFromTagName(widget);
    if (this.getAction(field)) return this.widgetFromTagName('solid-action');

    return !isSet ? this.widgetFromTagName(this.defaultWidget) : this.widgetFromTagName(this.defaultSetWidget);
  },
  /**
   * Return multiple widget if "field" is a multiple, false if it's not
   * @param field - string
   */
  multiple(field: string): WidgetInterface|null {
    const attribute = 'multiple-' + field;
    if (!this.element.hasAttribute(attribute)) return null;
    const widget = this.element.getAttribute(attribute) || this.defaultMultipleWidget;
    return this.widgetFromTagName(widget);
  },
  /**
   * If attribute "lookForAttr" is set on element, add "attrKey" to the "attributes" list
   * @param lookForAttr - string
   * @param setAttrKey - string
   * @param attributes - object
   */
  addToAttributes(lookForAttr: string, setAttrKey: string, attributes: object) {
    const attribute = this.element.getAttribute(lookForAttr);
    if (attribute == null) return;
    attributes[setAttrKey] = attribute;
  },
  /**
   * Return all the attributes of widget "field"
   * @param field - string
   */
  widgetAttributes(field: string): object {
    const attrs = { name: field };
    const escapedField = this.getEscapedField(field);

    const eachAttributes = ['each-range', 'each-label', 'each-placeholder', 'each-class'];
    const multipleAttributes = ['fields', 'label', 'widget', 'add-label', 'remove-label', 'next'];
    const defaultAttributes = ['range', 'label', 'placeholder', 'class', /* 'widget', */, 'required', 'editable', 'upload-url', 'option-label', 'order-by'];

    for (let attr of multipleAttributes) this.addToAttributes(`multiple-${escapedField}-${attr}`, attr, attrs)
    for (let attr of [...eachAttributes, ...defaultAttributes]) this.addToAttributes(`${attr}-${escapedField}`, attr,  attrs)
    if (this.multiple(escapedField)) attrs['widget'] = this.getWidget(escapedField).tagName;
    if (this.getAction(escapedField) && this.resource) attrs['src'] = this.resource['@id'];
    if (this.editable(escapedField) && this.resource) attrs['value-id'] = this.resource['@id'];

    return attrs;
  },
  /**
   * Creates and return a widget for field + add it to the widget list
   * @param field - string
   */
  createWidget(field: string): Element {
    if (!parent) parent = this.div;
    if (this.isSet(field)) return this.createSet(field);

    const attributes = this.widgetAttributes(field);
    const escapedField = this.getEscapedField(field);
    const widgetMeta = this.multiple(escapedField) || this.getWidget(escapedField);
    const widget = document.createElement(widgetMeta.tagName);

    // Set attributes
    if (widgetMeta.type === WidgetType.NATIVE) { // native widget (ie: h1)
      this.getValue(field).then(value => widget.textContent = value);
    } else { // custom widget (ie: solid-display-value)
      if (widgetMeta.type === WidgetType.USER) this.defineAttribute(widget, 'context', this.context, widgetMeta.type);
      for (let name of Object.keys(attributes)) {
        this.defineAttribute(widget, name, attributes[name], widgetMeta.type);
      }
      this.getValue(field).then((value: any) => {
        // setAttribute set a string. Make sure null values are empty
        if (value === null || value === undefined) value = '';
        this.defineAttribute(widget, 'value', value, widgetMeta.type);

        // Subscribe widgets if they show a resource
        if (value && value['@id']) {
          PubSub.subscribe(value['@id'], () => this.updateDOM())
          // TODO : remove subscriptions
        }
      });
    }

    this.widgets.push(widget);
    return widget;
  },
  defineAttribute(widget: HTMLElement, attribute: string, value: any, widgetType: WidgetType) {
    if (widgetType === WidgetType.USER && attribute !== "class") { // specific case, for class attr, use SetAttribute
      widget[attribute] = value; // for solid-widget, set property "value"
    } else {
      widget.setAttribute(attribute, value); // else, set attribute "value"
    }
  },
  /**
   * Create a set and add fields to it
   * @param field - string
   */
  createSet(field: string): Element {
    const widget = document.createElement(this.getWidget(field, true).tagName);
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