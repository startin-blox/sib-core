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
      super.connectedCallback()
      if (!this.dataset.src && !this.resource) this.populate()
    }

    get fields() {
      if (this.dataset.fields === 'data-fields') {
        return [];
      }
      if (this.dataset.fields) {
        return this.parseFieldsString(this.dataset.fields);
      }

      const resource =
        this.isContainer && this.resources ? this.resources[0] : this.resource;
      return Object.keys(resource)
        .filter(prop => !prop.startsWith('@'))
        .map(a => [a]);
    }

    isSet(field) {
      return this.hasAttribute('set-' + field);
    }

    async fetchValue(resource, field) {
      if (!(field in resource) && '@id' in resource) {
        resource = await store.get(resource);
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
      if (!this.isMultiple(field)) return value;
      if (value == null) return [];
      if ('ldp:contains' in value) value = value['ldp:contains'];
      if (!Array.isArray(value)) value = [value];
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
      if (this.getAction(field)) {
        return 'sib-action';
      }
      const value = this.getAttribute('widget-' + field);
      return value || this.defaultWidget;
    }
    async widgetAttributes(field) {
      const attrs = {
        value: await this.getValues(field),
        name: field,
      };
      const action = this.getAction(field);
      if (action) attrs.src = this.resource['@id'];
      return attrs;
    }

    async appendWidget(field, parent) {
      if (!parent) parent = this.div;
      const template = await this.getTemplate(field);
      if (template) {
        parent.appendChild(template);
      }
      if (this.isSet(field)) {
        await this.appendSet(field, parent);
      }

      const attributes = await this.widgetAttributes(field);
      if (this.isMultiple(field)) {
        return this.widgets.push(await this.appendMultipleWidget(field, attributes, parent));
      }
      const widget = document.createElement(this.getWidget(field));
      for (let name of Object.keys(attributes)) {
        widget[name] = attributes[name];
      }

      this.widgets.push(parent.appendChild(widget));
    }

    isMultiple(field) {
      return this.hasAttribute('multiple-' + field);
    }

    async appendMultipleWidget(field, attributes, parent=null) {
      const values = attributes.value;
      const wrapper = this.createMultipleWrapper(field, attributes, parent);
      wrapper.name = field;
      wrapper.widgets = [];
      for (const value of values) {
        attributes.value = value;
        const widget = this.insertSingleElement(field, attributes);
      }
      return wrapper;
    }

    createMultipleWrapper(field, attributes, parent = null) {
      const wrapper = document.createElement('sib-multiple');
      this.wrappers[field] = wrapper;
      if (parent) parent.appendChild(wrapper);
      return wrapper;
    }

    createSingleElement(field, attributes) {
      const widget = document.createElement(this.getWidget(field));
      for (let name of Object.keys(attributes)) {
        widget[name] = attributes[name];
      }
      return widget;
    }

    insertSingleElement(field, attributes) {
      const element = this.createSingleElement(field, attributes);
      const wrapper = this.wrappers[field];
      wrapper.appendChild(element);
      wrapper.widgets.push(element);
      return element;
    }

    async appendSet(field, parent) {
      const div = document.createElement('div');
      div.setAttribute('name', field);
      parent.appendChild(div);
      for (let item of this.getSet(field)) {
        this.appendWidget(item, div);
      }
    }

    async getTemplate(field) {
      const id = this.getAttribute(`template-${field}`);
      const template = document.getElementById(id);
      if (!(template instanceof HTMLTemplateElement)) return;
      const name = field;
      const value = await this.getValue(field);
      let html;
      try {
        html = evalTemplateString(template.innerHTML.trim(), {
          name,
          value: value === undefined ? {} : value,
        });
      } catch (e) {
        console.error(new Error(`error in template#${id}`), e);
        throw e;
      }
      return stringToDom(html);
    }
  };

export default SIBWidgetMixin;
