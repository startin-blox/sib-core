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
      fields.forEach(field => {
        field.toString = function() {
          return this.join('.');
        };
      });
      return fields;
    }

    connectedCallback() {
      super.connectedCallback()
      if (!this.attributes['data-src']) this.populate()
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
      if(!resource) return null
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
      if ('ldp:contains' in value) value = value['ldp:contains'];
      if (!Array.isArray(value)) value = [value];
      return value;
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
        return [parent.appendChild(template)];
      }
      if (this.isSet(field)) {
        return await this.appendSet(field, parent);
      }
      if (this.isMultiple(field)) {
        return await this.appendMultipleWidget(field, parent);
      }
      const attributes = await this.widgetAttributes(field);
      const widget = document.createElement(this.getWidget(field));
      for (let name of Object.keys(attributes)) {
        widget[name] = attributes[name];
      }
      return [parent.appendChild(widget)];
    }

    isMultiple(field) {
      return this.hasAttribute('multiple-' + field);
    }

    multipleElementWrap(content, parent) {
      const wrapper = document.createElement('div');
      wrapper.appendChild(content);
      if (parent) parent.appendChild(wrapper);
      return wrapper;
    }

    singleElementWrap(content, parent) {
      if (parent) parent.appendChild(content);
      return content;
    }

    async appendMultipleWidget(field, parent) {
      const attributes = await this.widgetAttributes(field);
      const widgetList = [];
      const values = attributes.value;
      const widgetsFragments = document.createDocumentFragment();
      for (const value of values) {
        let wrapper;
        const widget = document.createElement(this.getWidget(field));
        attributes.value = value;
        for (let name of Object.keys(attributes)) {
          widget[name] = attributes[name];
        }
        widgetList.push(widget);
        this.singleElementWrap(widget, widgetsFragments);
      }
      this.multipleElementWrap(widgetsFragments, parent);
      return widgetList;
    }

    async appendSet(field, parent) {
      const div = document.createElement('div');
      div.setAttribute('name', field);
      parent.appendChild(div);
      const widgetList = [];
      for (let item of this.getSet(field)) {
        widgetList.push(await this.appendWidget(item, div));
      }
      return widgetList;
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
