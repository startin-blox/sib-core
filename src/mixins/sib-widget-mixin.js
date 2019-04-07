import { store } from '../store.js';
import { stringToDom, evalTemplateString } from '../helpers/index.js';

const SIBWidgetMixin = superclass =>
  class extends superclass {
    constructor() {
      super();
      this.widgets = [];
      this.wrappers = {};
    }
    get div() {
      if (this._div) return this._div;
      this._div = document.createElement('div');
      this.appendChild(this._div);
      return this._div;
    }

    getSet(field) {
      return this.parseFieldsString(this.getAttribute('set-' + field));
    }

    parseFieldsString(fields) {
      fields = fields.split(',').map(s => s.trim().split(/\./));
      fields.forEach(field => {
        field.toString = function() {
          return this.join('.');
        };
      });
      return fields;
    }

    connectedCallback() {
      super.connectedCallback();
      if (!this.dataset.src && !this.resource) this.populate();
    }

    get fields() {
      if (this.dataset.fields === '') {
        return [];
      }
      if (this.dataset.fields) {
        return this.parseFieldsString(this.dataset.fields);
      }

      const resource =
        this.isContainer && this.resources ? this.resources[0] : this.resource;

      if (!resource) {
        console.error(new Error('You must provide a "data-fields" attribute'))
        return []
      }

      return Object.keys(resource)
        .filter(prop => !prop.startsWith('@'))
        .map(a => [a]);
    }

    isSet(field) {
      return this.hasAttribute('set-' + field);
    }

    async fetchValue(resource, field) {
      if (this.isContainer) return null;
      if (!(field in resource) && '@id' in resource) {
        resource = await store.get(resource, this.context);
      }
      if (!(field in resource)) {
        resource[field] = undefined;
      }
      return resource[field];
    }

    async getValue(field) {
      if (this.getAction(field)) {
        return this.getAction(field);
      }
      if (this.hasAttribute('value-' + field)) {
        return this.getAttribute('value-' + field);
      }
      let resource = this.resource;
      for (let name of field) {
        resource = await this.fetchValue(resource, name);
        if (resource == null) return;
      }
      return resource;
    }

    async getValues(field) {
      let value = await this.getValue(field);
      if (!this.multiple(field)) return value;
      if (value == null) return [];
      if (value['@type'] !== 'ldp:Container') {
        return [value];
      }
      if (!('ldp:contains' in value)) return [];
      value = value['ldp:contains'];
      if (!Array.isArray(value)) value = [value];
      value = await Promise.all(value.map(a => store.get(a)));
      return value;
    }

    empty() {
      this.widgets.length = 0;
      while (this.div.firstChild) this.div.removeChild(this.div.firstChild);
    }

    getAction(field) {
      const action = this.getAttribute('action-' + field);
      return action;
    }

    getWidget(field) {
      const widget = this.getAttribute('widget-' + field);
      if (widget) {
        if (!customElements.get(widget)) console.warn(`The widget ${widget} is not defined`);
        return widget;
      }
      if (this.getAction(field)) return 'sib-action';
      return this.defaultWidget;
    }
    async widgetAttributes(field) {
      const attrs = {
        value: await this.getValues(field),
        name: field,
      };
      if (this.hasAttribute('class-' + field))
        attrs.className = this.getAttribute('class-' + field);
      if (this.hasAttribute('range-' + field))
        attrs.range = this.getAttribute('range-' + field);
      if (this.hasAttribute('label-' + field))
        attrs.label = this.getAttribute('label-' + field);
      if (this.getAction(field)) attrs.src = this.resource['@id'];
      return attrs;
    }

    async appendWidget(field, parent) {
      if (!parent) parent = this.div;
      if (this.isSet(field)) {
        this.appendSet(field, parent);
        return;
      }

      const attributes = await this.widgetAttributes(field);

      if (this.multiple(field)) {
        return this.widgets.push(
          await this.appendMultipleWidget(field, attributes, parent),
        );
      }
      const widget = document.createElement(this.getWidget(field));
      for (let name of Object.keys(attributes)) {
        widget[name] = attributes[name];
      }

      this.widgets.push(parent.appendChild(widget));
    }

    multiple(field) {
      const attribute = 'multiple-' + field;
      if(!this.hasAttribute(attribute)) return null;
      return this.getAttribute(attribute) || this.defaultMultipleWidget;
    }

    async appendMultipleWidget(field, attributes, parent = null) {
      const values = attributes.value;
      const widget = document.createElement(this.multiple(field));
      // widget.dataset.src = this.dataset.src;
      for (let attr of ['range', 'widget', 'label', 'value']) {
        const value = this.getAttribute(`multiple-${attr}-${field}`);
        if (value == null) continue;
        widget.setAttribute(`${attr}-${field}`, value);
      }
      if (parent) parent.appendChild(widget);
      widget.name = field;
      console.log('–––––');
      
      console.log(this, attributes);
      widget.value = values;
      return widget;
    }

    async appendSet(field, parent) {
      const div = document.createElement('div');
      div.setAttribute('name', field);
      parent.appendChild(div);
      for (let item of this.getSet(field)) {
        await this.appendWidget(item, div);
      }
    }
  };

export default SIBWidgetMixin;
