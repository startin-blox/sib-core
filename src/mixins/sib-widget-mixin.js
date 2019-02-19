import { store } from '../store.js';
import { stringToDom, evalTemplateString } from '../helpers/index.js';

const SIBWidgetMixin = superclass => class extends superclass {
  /* eslint-disable no-underscore-dangle */
  get div() {
    if (this._div) return this._div;
    this._div = document.createElement('div');
    this.appendChild(this._div);
    return this._div;
  }

  getSet(field) {
    return this.parseFieldsString(this.getAttribute(`set-${field}`));
  }

  // eslint-disable-next-line class-methods-use-this
  parseFieldsString(fields) {
    const fieldsMap = fields.split(',').map(s => s.trim().split(/\./));
    fieldsMap.map((field) => { // eslint-disable-line arrow-body-style
      return {
        toString() {
          return field.join('.');
        },
        ...field,
      };
    });
    return fieldsMap;
  }

  get fields() {
    if (this.dataset.fields === 'data-fields') {
      return [];
    }
    if (this.dataset.fields) {
      return this.parseFieldsString(this.dataset.fields);
    }

    const resource = this.isContainer && this.resources ? this.resources[0] : this.resource;
    return Object.keys(resource)
      .filter(prop => !prop.startsWith('@'))
      .map(a => [a]);
  }

  isSet(field) {
    return this.hasAttribute(`set-${field}`);
  }

  // eslint-disable-next-line class-methods-use-this
  async fetchValue(res, field) {
    let resource = { ...res };
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
    if (this.hasAttribute(`value-${field}`)) {
      return this.getAttribute(`value-${field}`);
    }
    let { resource } = this;

    field.forEach(async (name) => {
      const res = await this.fetchValue(resource, name);
      if (res !== null) {
        resource = res;
      }
    });

    return resource;
  }

  empty() {
    while (this.div.firstChild) this.div.removeChild(this.div.firstChild);
  }

  getAction(field) {
    const action = this.getAttribute(`action-${field}`);
    return action;
  }

  getWidget(field) {
    if (this.getAction(field)) {
      return 'sib-action';
    }
    const value = this.getAttribute(`widget-${field.join('.')}`);
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

  async appendWidget(field, defaultParent) {
    const parent = defaultParent || this.div;

    const template = await this.getTemplate2(field);
    if (template) {
      parent.appendChild(template);
      return;
    }
    if (this.isSet(field)) {
      const div = document.createElement('div');
      div.setAttribute('name', field);
      parent.appendChild(div);

      const results = [];
      this.getSet(field).forEach((item) => {
        results.push(this.appendWidget(item, div));
      });

      await Promise.all(results);
    }

    const widget = document.createElement(this.getWidget(field));
    const attributes = await this.widgetAttributes(field);
    Object.keys(attributes).forEach((name) => {
      widget[name] = attributes[name];
    });
    parent.appendChild(widget);
  }

  async getTemplate2(field) {
    const id = this.getAttribute(`template-${field}`);
    const template = document.getElementById(id);
    if (!(template instanceof HTMLTemplateElement)) return null;
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
