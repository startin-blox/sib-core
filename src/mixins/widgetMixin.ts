import { type TemplateResult, html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  doesResourceContainPredicate,
  findClosingBracketMatchIndex,
  parseFieldsString,
} from '../libs/helpers.ts';
import { preHTML, spread } from '../libs/lit-helpers.ts';
import { newWidgetFactory } from '../new-widgets/new-widget-factory.ts';
import {
  type Resource,
  type WidgetInterface,
  WidgetType,
} from './interfaces.ts';

const WidgetMixin = {
  name: 'widget-mixin',
  use: [],
  attributes: {
    fields: {
      type: String,
      default: undefined,
    },
  },
  initialState: {
    nameWidgets: null,
    _div: null,
  },
  created(): void {
    this.nameWidgets = [];
  },
  attached(): void {
    if (!this.dataSrc && !this.resource && this.noRender === null)
      this.populate();
  },
  get parentElement(): string {
    return 'div';
  },
  get div(): HTMLElement {
    if (this._div) return this._div;
    this._div = document.createElement(this.parentElement);
    this.element.appendChild(this._div);
    return this._div;
  },
  set div(value) {
    this._div = value;
  },
  get widgets() {
    return this.nameWidgets.map((name: string) =>
      this.element.querySelector(`[name="${name}"]`),
    );
  },
  /**
   * Return field list of the component
   */
  async getFields(): Promise<string[]> {
    // TODO : improve code
    const attr = this.fields;
    if (attr === '') return [];
    if (attr) return parseFieldsString(attr);

    let resource = this.resource as Resource;
    if (resource?.isContainer?.()) {
      // If container, keep the 1rst resource
      const resources = resource['listPredicate'];
      for (const res of resources) {
        resource = res;
        break;
      }
    } else if (resource && this.arrayField && this.predicateName) {
      // if array, keep the 1rst resource
      for (const res of resource[this.predicateName]) {
        resource = res;
        break;
      }
    }

    if (!this.dataSrc)
      console.error(new Error('You must provide a "fields" attribute'));
    if (!resource) return [];

    const fields: string[] = [];
    for (const prop of resource.properties) {
      if (!prop.startsWith('@') && !(prop === 'permissions')) {
        if (!this.isAlias(prop) && (await resource[prop])) fields.push(prop);
        else if (this.isAlias(prop)) fields.push(prop);
      }
    }
    return fields;
  },
  /**
   * return attribute if "field" is an action
   * @param field - string
   */
  getAction(field: string): string {
    const action = this.element.getAttribute(`action-${field}`);
    return action;
  },
  /**
   * return true if "field" is editable
   * @param field - string
   */
  editable(field: string): string {
    return this.element.hasAttribute(`editable-${field}`);
  },
  /**
   * Return regexp to check if "field" is a set
   * @param field - string
   */
  getSetRegexp(field: string) {
    return new RegExp(`(^|\\,|\\(|\\s)\\s*${field}\\s*\\(`, 'g');
  },
  /**
   * Return fields contained in set "field"
   * @param field - string
   */
  getSet(field: string): string[] {
    const setString = this.fields.match(this.getSetRegexp(field));
    if (!setString) return [];
    const firstSetBracket =
      this.fields.indexOf(setString[0]) + setString[0].length - 1;
    const lastSetBracket = findClosingBracketMatchIndex(
      this.fields,
      firstSetBracket,
    );
    const set = this.fields.substring(firstSetBracket + 1, lastSetBracket);
    return parseFieldsString(set);
  },
  /**
   * Return true if "field" is a set
   * @param field - string
   */
  isSet(field: string): boolean {
    if (!this.fields) return false;
    const foundSets = this.fields.match(this.getSetRegexp(field));
    return foundSets ? foundSets.length > 0 : false;
  },
  /**
   * Return true if "field" is a string
   * @param field - string
   */
  isString(field: string): boolean {
    return field.startsWith("'") || field.startsWith('"');
  },
  /**
   * Return true if "field" is an alias (contains " as ")
   * @param field - string
   */
  isAlias(field: string): boolean {
    const aliasRegex = /^[\w@.]+\s+as\s+[\w@.]+$/;
    return aliasRegex.test(field);
  },
  /**
   * Return the value of "resource" for predicate "field"
   * @param field - string
   * @param resource - Resource
   */
  async fetchValue(field: string, resource: Resource) {
    if (resource && !resource.isContainer?.()) {
      let fieldValue = await resource[field];
      if (
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === ''
      ) {
        const expandedPredicate = sibStore.getExpandedPredicate(
          field,
          this.context,
        );
        fieldValue = await resource[expandedPredicate];
      }

      if (fieldValue === null || fieldValue === undefined || fieldValue === '')
        return undefined;

      if (
        Array.isArray(fieldValue) &&
        !doesResourceContainPredicate(fieldValue, this.context)
      ) {
        return JSON.stringify(fieldValue);
        // Dumb edge case because if the array bears only one item, when compacted the array translates into one object
      }
      if (
        typeof fieldValue === 'object' &&
        fieldValue['@id'] &&
        Object.keys(fieldValue).length === 1
      ) {
        return JSON.stringify([fieldValue]);
      }
    }
    return resource && !resource.isContainer?.()
      ? await resource[field]
      : undefined;
  },
  /**
   * Return the value of the field
   * @param field - field
   */
  async getValue(field: string, resource: Resource) {
    const escapedField = this.getEscapedField(field);
    if (this.getAction(escapedField)) {
      return this.getAction(escapedField);
    }

    if (this.element.hasAttribute(`value-${field}`)) {
      return this.element.getAttribute(`value-${field}`);
    }

    if (this.isAlias(field)) {
      const alias = field.split(' as ');
      return await this.fetchValue(alias[0], resource);
    }

    const resourceValue = await this.fetchValue(field, resource);
    // Empty value
    if (
      resourceValue === undefined ||
      resourceValue === '' ||
      resourceValue === null
    )
      // If null or empty, return field default value
      return this.element.hasAttribute(`default-${field}`)
        ? this.element.getAttribute(`default-${field}`)
        : '';

    return resourceValue;
  },
  empty(): void {},
  /**
   * Return a widget from a tagName, and create it if necessary
   * @param tagName - string
   */
  widgetFromTagName(tagName: string) {
    let type = tagName.startsWith('solid')
      ? WidgetType.CUSTOM
      : WidgetType.USER;
    if (!customElements.get(tagName)) {
      // component does not exist
      if (tagName.startsWith('solid'))
        newWidgetFactory(tagName); // solid- -> create it
      else type = WidgetType.NATIVE; // or use a native tag
    }
    return { tagName, type }; // return tagName
  },
  /**
   * Return widget for field "field"
   * @param field - string
   * @param isSet - boolean
   */
  getWidget(field: string, isSet = false): WidgetInterface {
    if (this.isAlias(field)) field = field.split(' as ')[1];
    const widget = this.element.getAttribute(`widget-${field}`);

    if (widget) return this.widgetFromTagName(widget);
    if (this.getAction(field)) return this.widgetFromTagName('solid-action');

    return !isSet
      ? this.widgetFromTagName(this.defaultWidget)
      : this.widgetFromTagName(this.defaultSetWidget);
  },
  /**
   * Return multiple widget if "field" is a multiple, false if it's not
   * @param field - string
   */
  multiple(field: string): WidgetInterface | null {
    const attribute = `multiple-${field}`;
    if (!this.element.hasAttribute(attribute)) return null;
    const widget =
      this.element.getAttribute(attribute) || this.defaultMultipleWidget;
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
   * @param resource - Resource
   */
  widgetAttributes(field: string, resource: Resource): object {
    const attrs: Record<string, string> = { name: field };
    if (this.isAlias(field)) field = field.split(' as ')[1];
    const escapedField = this.getEscapedField(field);

    // transfer all multiple-[field]-[attr] attributes as [attr] for multiple widget [field]
    const multipleAttributes = [
      'fields',
      'label',
      'widget',
      'add-label',
      'remove-label',
      'next',
      'empty-widget',
      'add-class',
      'remove-class',
    ];
    for (const attr of multipleAttributes)
      this.addToAttributes(`multiple-${escapedField}-${attr}`, attr, attrs);

    // transfer all [attr]-[field] attributes as [attr] attribute for widget [field]
    const defaultAttributes = [
      'range',
      'enum',
      'label',
      'placeholder',
      'class',
      /* 'widget', */
      'required',
      'editable',
      'autocomplete',
      'upload-url',
      'option-label',
      'option-value',
      'order-by', // deprecated. Remove in 0.15
      'each-label',
      'order-asc',
      'order-desc',
      'min',
      'max',
      'pattern',
      'title',
      'start-value',
      'end-value',
      'alt',
      'step',
      'maxlength',
      'minlength',
      'search-text',
      'search-placeholder',
      'link-text',
      'target-src',
      'data-label',
    ];
    for (const attr of defaultAttributes)
      this.addToAttributes(`${attr}-${escapedField}`, attr, attrs);

    const addableAttributes: Attr[] = (
      Array.from(this.element.attributes) as Attr[]
    ).filter((a: Attr) => a.name.startsWith(`addable-${escapedField}`));
    for (const attr of addableAttributes)
      this.addToAttributes(
        attr.name,
        attr.name.replace(`addable-${escapedField}`, 'addable'),
        attrs,
      );

    const resourceId = resource?.['@id'] ?? null;
    if (this.multiple(escapedField))
      attrs.widget = this.getWidget(escapedField).tagName;
    if (this.getAction(escapedField) && resourceId)
      attrs.src =
        this.element.getAttribute(`src-${escapedField}`) || resourceId;
    if (this.editable(escapedField) && resourceId)
      attrs['value-id'] = resourceId;
    return attrs;
  },
  /**
   * Creates and return a widget for field + add it to the widget list
   * @param field - string
   */
  async createWidgetTemplate(
    field: string,
    resource = null,
    transformAttributes = false,
  ): Promise<TemplateResult> {
    if (this.isString(field)) return this.createString(field); // field is a static string
    if (this.isSet(field)) return await this.createSet(field);

    const currentResource = resource || this.resource;
    let attributes = this.widgetAttributes(field, currentResource);
    const escapedField = this.getEscapedField(field);
    const widgetMeta =
      this.multiple(escapedField) || this.getWidget(escapedField);
    let tagName = widgetMeta.tagName;
    let widgetTemplate: TemplateResult = html``;
    const classAttr = attributes.class;

    // Set attributes
    const value = await this.getValue(field, currentResource);
    if (widgetMeta.type === WidgetType.NATIVE) {
      // native widget (ie: h1)
      widgetTemplate = preHTML`<${tagName} name="${ifDefined(attributes.name)}" class="${ifDefined(attributes.class)}">${value}</${tagName}>`;
    } else {
      // custom widget (ie: solid-display-value)
      // Check if value is defined, and if the default widget is needed
      if (
        (value === null || value === '') &&
        this.element.hasAttribute(`default-widget-${field}`)
      ) {
        tagName = this.element.getAttribute(`default-widget-${field}`);
      }
      // Set attributes to the widget
      // setAttribute set a string. Make sure null values are empty
      if (value === null || value === undefined) attributes.value = '';
      if (widgetMeta.type === WidgetType.USER) {
        // if value is a resource and solid-widget used, set data-src
        if (value['@id']) {
          attributes['data-src'] = value['@id'];
        } else {
          try {
            const isUrl = new URL(value);
            if (isUrl) attributes['data-src'] = value;
          } catch {}

          // in any case, set value attribute
          attributes.value = value;
        }
      } else {
        // otherwise, set value attribute
        attributes.value = value;
      }

      // Subscribe widgets if they show a resource
      if (value?.['@id']) attributes['auto-subscribe'] = value['@id'];

      // Transform store://XXX attributes
      if (transformAttributes)
        attributes = await this.transformAttributes(
          attributes,
          currentResource,
        );

      if (value?.['@id']) attributes['auto-subscribe'] = value['@id'];
      widgetTemplate = preHTML`
        <${tagName}
          ...=${spread(attributes)}
          class="${classAttr !== undefined ? tagName.concat(' ', classAttr) : tagName}"
        ></${tagName}>`;
    }

    this.nameWidgets.push(field);
    return widgetTemplate;
  },
  defineAttribute(widget: HTMLElement, attribute: string, value: any) {
    if (widget.getAttribute(attribute) !== value) {
      // if attribute is different than previous one
      widget.setAttribute(attribute, value); // set it
    }
  },
  /**
   * Create a set and add fields to it
   * @param field - string
   */
  async createSet(field: string): Promise<TemplateResult> {
    const setWidget = this.getWidget(field, true);

    // Get set attributes
    const attrs = { name: field, class: setWidget.tagName };
    const setAttributes = ['class', 'label'];
    for (const attr of setAttributes)
      this.addToAttributes(`${attr}-${field}`, attr, attrs);
    // Reset class attribute if a class is specified for the set
    if (attrs.class !== undefined) {
      attrs.class = setWidget.tagName.concat(' ', attrs.class);
    } else attrs.class = setWidget.tagName;

    // Create widget if not already existing
    let widget = this.element.querySelector(
      `${setWidget.tagName}[name="${field}"]`,
    );
    let initializing = false; // used to render widget only first time
    if (!widget) {
      widget = document.createElement(setWidget.tagName);
      initializing = true;
    }
    for (const name of Object.keys(attrs)) {
      this.defineAttribute(widget, name, attrs[name], setWidget.type);
    }
    if (widget.component && initializing) widget.component.render();
    const setFields = this.getSet(field);
    // Catch widget for the set if all these fields are empty
    if (this.element.hasAttribute(`empty-${field}`)) {
      let hasOnlyEmpty = true;
      for (const field of setFields) {
        const value: string = await this.getValue(field, this.resource);
        if (value !== '') {
          // if one not empty
          hasOnlyEmpty = false;
          break;
        }
      }
      if (hasOnlyEmpty) {
        // if only empty values, return empty-widget
        const attributes = this.widgetAttributes(field, this.resource);
        const tagName = this.element.getAttribute(`empty-${field}`);
        const valueSet = this.element.getAttribute(`empty-${field}-value`);
        if (valueSet) attributes.value = valueSet;
        return preHTML`
        <${tagName}
          ...=${spread(attributes)}
          class="${tagName}"
        ></${tagName}>`;
      }
    }
    // Render template
    const widgetsTemplate = await Promise.all(
      setFields.map((field: string) => this.createWidgetTemplate(field)),
    );
    const template = html`${widgetsTemplate}`;
    render(template, widget.querySelector('[data-content]') || widget);
    return widget;
  },
  createString(value: string): TemplateResult {
    return html`<span>${value.slice(1, -1).replace(/\\(['"])/g, '$1')}</span>`;
  },
  /**
   * Returns field name without starting "@"
   * @param field
   */
  getEscapedField(field: string): string {
    return field.startsWith('@') ? field.slice(1, field.length) : field;
  },
};

export { WidgetMixin };
