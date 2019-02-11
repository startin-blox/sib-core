import { store } from '../store.js';
import { stringToDom, evalTemplateString } from '../helpers/index.js';

const SIBWidgetMixin = superclass =>
  class extends superclass {
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
      fields.toString = function() {
        return this.join('.');
      };
      return fields;
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

    empty() {
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
      const value = this.getAttribute('widget-' + field.join('.'));
      return value || this.defaultWidget;
    }

    async widgetAttributes(field) {
      const attrs = {
        value: await this.getValue(field),
        name: field,
      };
      const action = this.getAction(field);
      if (action) attrs.src = this.resource['@id'];
      return attrs;
    }

    async appendWidget(field, parent) {
      if (!parent) parent = this.div;

      const template = await this.getTemplate2(field);
      if (template) {
        parent.appendChild(template);
        return;
      }
      if (this.isSet(field)) {
        const div = document.createElement('div');
        console.log(field, this.resources['@id']);
        div.setAttribute('name', field);
        parent.appendChild(div);
        for (let item of this.getSet(field)) await this.appendWidget(item, div);
        return;
      }
      let widget;
      let attributes;

      widget = document.createElement(this.getWidget(field));
      attributes = await this.widgetAttributes(field);
      for (let name of Object.keys(attributes)) {
        widget[name] = attributes[name];
      }
      parent.appendChild(widget);
    }

    async getTemplate2(field) {
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
