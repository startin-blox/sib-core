import { Sib } from './Sib.js';
import { base_context, store } from './store.js';
import { parseFieldsString } from './helpers/index.js';

const StoreMixin = {
  name: 'store-mixin',
  use: [],
  attributes: {
    dataSrc: {
      type: String,
      default: '',
      callback: function (value: string) {
        this.empty();

        // brings a loader out if the attribute is set
        this.toggleLoaderHidden(false);

        if (!value) return;

        // gets the data through the store
        store.get(value + this.idSuffix, this.getContext()).then(async resource => {
          this.empty();
          this.resource = resource;
          this.populate();
          this.toggleLoaderHidden(true);
        });
      },
    },
    idSuffix: {
      type: String,
      default: ''
    },
    extraContext: {
      type: String,
      default: '{}'
    },
    next: {
      type: String,
      default: ''
    },
    loaderId: {
      type: String,
      default: ''
    },
  },
  initialState: {
    resource: {},
  },
  getContext() {
    return { ...base_context, ...JSON.parse(this.extraContext) };
  },
  isContainer() {
    return '@type' in this.resource && this.resource['@type'] === 'ldp:Container';
  },
  getResources() {
    if (!this.isContainer() || !this.resource['ldp:contains']) return [];
    if (Array.isArray(this.resource['ldp:contains']))
      return this.resource['ldp:contains'];
    return [this.resource['ldp:contains']];
  },
  toggleLoaderHidden(toggle: boolean) {
    if (this.loaderId) {
      const loader = document.getElementById(this.loaderId);
      if (loader) loader.toggleAttribute('hidden', toggle);
    }
  },
};


const ListMixin = {
  name: 'list-mixin',
  use: [],
  appendSingleElt() {
    this.appendChildElt(this.resource);
  },
  populate() {
    if (!this.isContainer()) {
      this.appendSingleElt();
      return;
    }

    for (let resource of this.getResources()) {
      //for federations, fetch every sib:source we find
      if (resource['@type'] !== 'sib:source') {
        this.appendChildElt(resource);
        continue;
      }
      store.get(resource.container, this.context).then(container => {
        for (let resource of container['ldp:contains']) {
          this.appendChildElt(resource);
        }
      });
    }
  }
}


const WidgetMixin = {
  name: 'widget-mixin',
  use: [],
  attributes: {
    dataFields: {
      type: String,
      default: '',
    }
  },
  initialState: {
    widgets: [],
    wrappers: {}
  },
  getDiv() {
    if (this._div) return this._div;
    this._div = document.createElement('div');
    this.element.appendChild(this._div);
    return this._div;
  },
  getSet(field: string) {
    return parseFieldsString(this.getAttribute('set-' + field));
  },
  getAction(field: string) {
    const action = this.getAttribute('action-' + field);
    return action;
  },
  getWidget(field: string) {
    const widget = this.getAttribute('widget-' + field);
    if(widget) return widget;
    if (this.getAction(field)) return 'sib-action';
    return this.defaultWidget;
  },
  isMultiple(field:string) {
    return this.hasAttribute('multiple-' + field);
  },
  isSet(field: string) {
    return this.hasAttribute('set-' + field);
  },
  getFields() {
    if (this.dataFields === '') {
      return [];
    }
    if (this.dataFields) {
      return parseFieldsString(this.dataFields);
    }

    const resource =
      this.isContainer() && this.getResources() ? this.getResources()[0] : this.resource;
    return Object.keys(resource)
      .filter(prop => !prop.startsWith('@'))
      .map(a => [a]);
  },
  async fetchValue(resource, field: string) {
    if (!resource || this.isContainer()) return null;
    if (!(field in resource) && '@id' in resource) {
      resource = await store.get(resource, this.context);
    }
    if (!(field in resource)) {
      resource[field] = undefined;
    }
    return resource[field];
  },
  async getValue(field: string) {
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
  empty() {
    this.widgets.length = 0;
    while (this.getDiv().firstChild) this.getDiv().removeChild(this.getDiv().firstChild);
  },
  async appendWidget(field: string, parent: HTMLElement) {
    if (!parent) parent = this.div;
    const template = await this.getTemplate(field);
    if (template) {
      parent.appendChild(template);
    }
    if (this.isSet(field)) {
      this.appendSet(field, parent);
      return;
    }

    if (this.isMultiple(field)) {
      return this.widgets.push(
        await this.appendMultipleWidget(field, [], parent),
      );
    }
    const widget = document.createElement(this.getWidget(field));
    this.widgets.push(parent.appendChild(widget));
  },
  async appendMultipleWidget(field: string, attributes, parent = null) {
    const values = attributes.value;
    const wrapper = this.createMultipleWrapper(field, attributes, parent);
    wrapper.name = field;
    wrapper.widgets = [];
    for (const value of values) {
      attributes.value = value;
      this.insertSingleElement(field, attributes);
    }
    return wrapper;
  },
  createMultipleWrapper(field: string, _attributes, parent) {
    const wrapper = document.createElement('sib-multiple');
    this.wrappers[field] = wrapper;
    if (parent !== null) {
      parent.appendChild(wrapper);
    }
    return wrapper;
  },

  createSingleElement(field: string, attributes) {
    const widget = document.createElement(this.getWidget(field));
    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }
    return widget;
  },

  insertSingleElement(field: string, attributes) {
    const element = this.createSingleElement(field, attributes);
    const wrapper = this.wrappers[field];
    wrapper.appendChild(element);
    wrapper.widgets.push(element);
    return element;
  },

  async appendSet(field: string, parent) {
    const div = document.createElement('div');
    div.setAttribute('name', field);
    parent.appendChild(div);
    for (let item of this.getSet(field)) {
      await this.appendWidget(item, div);
    }
  }
}

const SibDisplay = {
  name: 'sib-display',
  use: [WidgetMixin, ListMixin, StoreMixin],
  initialState: {
    defaultWidget: 'sib-display-div',
    fields: []
  },
  getChildTag() {
    return this.tagName;
  },
  appendChildElt(resource) {
    const child = document.createElement(this.getChildTag());
    child.resource = resource;
    this.getDiv().appendChild(child);
  },
  async appendSingleElt() {
    console.log('widget');
    for (let field of this.getFields()) {
      await this.appendWidget(field);
    }
  }
};

Sib.register(SibDisplay);
document.createElement('sib-display');