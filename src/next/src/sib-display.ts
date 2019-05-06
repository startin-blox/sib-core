import { Sib } from './Sib.js';
import { base_context, store } from './store.js';
import { parseFieldsString, stringToDom, evalTemplateString } from './helpers/index.js';

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
          await this.populate();
          // this.dispatchEvent(new CustomEvent('populate', { detail: { resource: resource } }));
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
  /*attached() {
    if (this.resource) this.populate();
  },*/
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
  /*async getUser() {
    // wait for dom
    await domIsReady();
    const sibAuth = document.querySelector('sib-auth');

    // if sib-auth element is not found, return undefined
    if (!sibAuth) {
      return undefined;
    }

    // if element is defined, wait custom element to be ready
    await customElements.whenDefined('sib-auth');

    return sibAuth.getUser();
  }*/
};


const ListMixin = {
  name: 'list-mixin',
  use: [],
  attributes: {
    paginateBy: {
      type: Number,
      default: 0
    },
    counterTemplate: {
      type: String,
      default: ''
    }
  },
  initialState: {
    filters: {},
    filtersAdded: false,
    currentPage: 1,
    searchForm: null,
  },
  setFilters(filters) {
    this.filters = filters;
    if (!this.resource) return;
    this.empty();
    this.populate();
  },
  matchValue(propertyValue, filterValue) {
    if (Array.isArray(filterValue)) return this.matchRangeValues(propertyValue, filterValue)
    if (filterValue === '') return true;
    if (propertyValue == null) return false;
    if (propertyValue['ldp:contains']) {
      return this.matchValue(propertyValue['ldp:contains'], filterValue);
    }
    if (Array.isArray(propertyValue)) {
      return propertyValue.reduce(
        (initial, value) => initial || this.matchValue(value, filterValue),
        false,
      );
    }
    if (propertyValue['@id']) {
      //search in ids
      return (
        filterValue['@id'] === '' ||
        propertyValue['@id'] === filterValue ||
        propertyValue['@id'] === filterValue['@id']
      );
    }

    if (typeof propertyValue === 'number') { //check if number
      return propertyValue === Number(filterValue);
    }
    if (typeof propertyValue === 'boolean') { //check if boolean
      return propertyValue === Boolean(filterValue);
    }
    if (typeof propertyValue === 'string') { //search in strings
      return (
        propertyValue.toLowerCase().indexOf(String(filterValue).toLowerCase()) !== -1
      );
    }
    return false;
  },
  matchRangeValues(propertyValue, filterValues) {
    if (propertyValue == null) return false;

    if (typeof propertyValue === 'number' || typeof propertyValue === 'string') {
      return (filterValues[0] ? propertyValue >= filterValues[0] : true) &&
        (filterValues[1] ? propertyValue <= filterValues[1] : true)
    }
    console.warn(`Impossible to filter a ${typeof propertyValue} value with a range widget`)
    return;
  },
  // TODO : to be moved in the store and mutualized with widgetMixin.getValue
  applyFilterToResource(resource, filter) {
    if (!Array.isArray(filter)) return resource[filter];
    if (filter.length === 0) return;
    if (filter.length === 1) return resource[filter[0]];

    let firstFilter = filter.shift();
    return this.applyFilterToResource(resource[firstFilter], filter);
  },
  matchFilter(resource, filter, value) {
    if (!this.isSet(filter)) {
      return this.matchValue(
        this.applyFilterToResource(resource, filter),
        value,
      );
    }

    // for sets, return true if it matches at least one of the fields
    return this.getSet(filter).reduce(
      (initial, field) => initial || this.matchFilter(resource, field, value),
      false,
    );
  },
  matchFilters(resource) {
    //return true if all filters values are contained in the corresponding field of the resource
    return Object.keys(this.filters).reduce(
      (initial, filter) =>
        initial && this.matchFilter(resource, filter, this.filters[filter]),
      true,
    );
  },
  setCurrentPage(page) {
    if (page < 1) page = 1;
    if (page > this.getPageCount()) page = this.getPageCount();
    this.currentPage = page;
    this.populate();
  },
  getPageCount() {
    return Math.max(1, Math.ceil(this.resources.length / this.paginateBy));
  },
  getCurrentPageResources() {
    if (this.paginateBy == 0) return this.resources;
    const firstElementIndex = (this.currentPage - 1) * this.paginateBy;
    return this.resources.slice(
      firstElementIndex,
      firstElementIndex + this.paginateBy,
    );
  },
  renderPaginationNav() {
    const paginateBy = this.paginateBy;
    if (this._paginationElements) {
      this._paginationElements.nav.toggleAttribute(
        'hidden',
        paginateBy == null,
      );
    }
    if (paginateBy == null) return;
    if (!this._paginationElements) {
      //const elements = (this._paginationElements = {});
      stringToDom(/*html*/ `<nav data-id='nav'>
      <button data-id="prev">←</button>
      <button data-id="next">→</button>
      <span>
      <span data-id="current">0</span>
      / <span data-id="count">0</span>
      </span>
      </nav>`);
      /*nav.querySelectorAll('[data-id]').forEach(elm => {
        const id = elm.dataset.id;
        delete elm.dataset.id;
        elements[id] = elm;
      });
      this.insertBefore(elements.nav, div.nextSibling);
      elements.prev.addEventListener('click', () => {
        this.currentPage -= 1;
        this.empty();
        this.populate();
      });
      elements.next.addEventListener('click', () => {
        this.currentPage += 1;
        this.empty();
        this.populate();
      });*/
    }
    const elements = this._paginationElements;
    elements.current.textContent = this.currentPage;
    elements.count.textContent = this.pageCount;
    elements.prev.toggleAttribute('disabled', this.currentPage <= 1);
    elements.next.toggleAttribute('disabled',this.currentPage >= this.pageCount);
    return;
  },
  getResources() {
    return this.resources.filter(this.matchFilters.bind(this));
  },
  appendFilters() {
    this.searchForm = document.createElement('sib-form');
    this.searchForm.resource = this.resource;
    this.searchForm.save = this.filterList.bind(this);
    this.searchForm.change = this.filterList.bind(this);
    this.searchForm.dataset.fields = this.getAttribute('search-fields');
    this.searchForm.toggleAttribute('naked', true);
    this.searchForm.addEventListener('input', () => this.currentPage = 1);

    //displays applied filter values in the form
    for (let filter of Object.keys(this.filters)) {
      if (this.searchForm.dataset.fields.indexOf(filter) != -1) {
        this.searchForm.setAttribute('value-' + filter, this.filters[filter]);
      }
    }
    //pass range attributes
    let filters = {};
    for (let field of this.searchForm.fields) {
      for (let attr of ['range', 'widget', 'label', 'value']) {
        const value = this.getAttribute(`search-${attr}-${field}`);
        if (value == null) continue;
        this.searchForm.setAttribute(`${attr}-${field}`, value);
        if(field && attr == "value") filters[field] = value;
      }
    }

    if (this.shadowRoot)
      this.shadowRoot.insertBefore(this.searchForm, this.shadowRoot.firstChild);
    else this.insertBefore(this.searchForm, this.firstChild);

    this.filtersAdded = true;
    this.filters = filters;
  },
  populate() {
    const div = this.getDiv();

    if (!this.isContainer()) {
      this.appendSingleElt();
      return;
    }
    if (!this.filtersAdded && this.hasAttribute('search-fields')) {
      this.appendFilters();
      return;
    }

    if (this.counterTemplate) {
      let html;
      try {
        html = evalTemplateString(this.getAttribute('counter-template'), {
          counter: this.resources.length,
        });
      } catch (e) {
        console.error(new Error('error in counter-template'), e);
        throw e;
      }
      if (!this.counter) {
        this.counter = document.createElement('div');
        this.insertBefore(this.counter, div);
      }
      this.counter.innerHTML = '';
      this.counter.appendChild(stringToDom(html));
    }
    this.renderPaginationNav(div);

    for (let resource of this.getResources()) {
      //for federations, fetch every sib:source we find
      if (resource['@type'] !== 'sib:source') {
        this.appendChildElt(resource, div);
        continue;
      }
      store.get(resource.container, this.context).then(container => {
        for (let resource of container['ldp:contains']) {
          this.appendChildElt(resource, div);
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
    wrappers: {},
    div: null
  },
  getDiv() {
    if (this.div) return this.div;
    this.div = document.createElement('div');
    this.element.appendChild(this.div);
    return this.div;
  },
  getSet(field: string) {
    return parseFieldsString(this.getAttribute('set-' + field));
  },
  getAction() {
    //const action = this.getAttribute('action-' + field);
    const action = "";
    return action;
  },
  /*isMultiple(field:string) {
    return this.hasAttribute('multiple-' + field);
  },
  isSet(field: string) {
    return this.hasAttribute('set-' + field);
  },*/
  isMultiple() {
    return false;
  },
  isSet() {
    return false;
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

      if (!resource) {
        console.error(new Error('You must provide a "data-fields" attribute'));
        return [];
      }

    return Object.keys(resource)
      .filter(prop => !prop.startsWith('@'))
      .map(a => [a]);
  },
  async fetchValue(resource, field: string) {
    if (this.isContainer()) return null;
    if (!(field in resource) && '@id' in resource) {
      resource = await store.get(resource, this.getContext());
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
    /*if (this.hasAttribute('value-' + field)) {
      return this.getAttribute('value-' + field);
    }*/
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
    // create a new empty div next to the old one
    if (this.div) {
      let newDiv = document.createElement('div')
      this.insertBefore(newDiv, this.div)
      this.removeChild(this.div)
      this.div = newDiv
    }
  },
  getWidget(field: string) {
    //const widget = this.getAttribute('widget-' + field);
    const widget = '';
    if (widget) {
      if (!customElements.get(widget)) {
        console.warn(`The widget ${widget} is not defined`);
      }
      return widget;
    }
    if (this.getAction(field)) return 'sib-action';
    return this.defaultWidget;
  },
  async appendWidget(field: string, parent: HTMLElement) {
    if (!parent) parent = this.getDiv();

    if (this.isSet(field)) {
      await this.appendSet(field, parent);
      return;
    }

    const attributes = await this.widgetAttributes(field);

    // const tagName = this.multiple(field) || this.getWidget(field);
    const tagName = this.getWidget(field);
    const widget = document.createElement(tagName);
    /*if (this.multiple(field)) {
      widget.setAttribute('widget', this.getWidget(field));
    }*/

    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }

    this.widgets.push(parent.appendChild(widget));
  },


  multiple(field: string) {
    const attribute = 'multiple-' + field;
    if (!this.hasAttribute(attribute)) return null;
    return this.getAttribute(attribute) || this.defaultMultipleWidget;
  },

  async appendSet(field: string, parent) {
    const div = document.createElement('div');
    div.setAttribute('name', field);
    parent.appendChild(div);
    for (let item of this.getSet(field)) {
      await this.appendWidget(item, div);
    }
  },
  async widgetAttributes(field: string) {
    const attrs = {
      name: field,
      value: null
    };
    /*for (let attr of ['range', 'label', 'class']) {
      const value = this.getAttribute(`each-${attr}-${field}`);

      if (value == null) continue;
      attrs[`each-${attr}`] = value;
    }
    for (let attr of ['range', 'label', 'class', 'widget']) {
      const value = this.getAttribute(`${attr}-${field}`);
      if (value == null) continue;
      if (attr === 'class') attr = 'className';
      attrs[attr] = value;
    }
    if (this.getAction(field)) attrs.src = this.resource['@id'];*/
    attrs.value = await this.getValues(field);

    return attrs;
  }

}

const SibDisplay = {
  name: 'sib-display',
  use: [WidgetMixin, ListMixin, StoreMixin],
  initialState: {
    defaultWidget: 'sib-display-value',
    defaultMultipleWidget: 'sib-multiple',
    fields: []
  },
  created() {
    window.addEventListener('navigate', () => {
      if (this.resource == null) return;
      //if (event.detail.resource == null) return;
      /*if (this.resource['@id'] == null) return;
      this.toggleAttribute(
        'active',
        this.resource['@id'] === event.detail.resource['@id'],
      );*/
    });
  },
  getChildTag() {
    return this.dataset.child || this.tagName;
  },
  // Here "even.target" points to the content of the widgets of the children of sib-display
  dispatchSelect(event) {
    const resource = event.target.closest(this.childTag).resource;
    this.dispatchEvent(
      new CustomEvent('resourceSelect', { detail: { resource: resource } }),
    );
    if (this.next) {
      this.dispatchEvent(
        new CustomEvent('requestNavigation', {
          bubbles: true,
          detail: { route: this.next, resource: resource },
        }),
      );
    }
  },
  appendChildElt(resource, parent) {
    const child = document.createElement(this.getChildTag());
    child.resource = resource;
    if (this.dataset.fields != null) child.dataset.fields = this.dataset.fields;

    for (let attr of this.attributes) //copy widget and value attributes
      if (
        attr.name.startsWith('value-') ||
        attr.name.startsWith('label-') ||
        attr.name.startsWith('set-') ||
        attr.name.startsWith('widget-') ||
        attr.name.startsWith('class-') ||
        attr.name.startsWith('multiple-') ||
        attr.name.startsWith('action-')
      )
        child.setAttribute(attr.name, attr.value);

    parent.appendChild(child);
  },
  async appendSingleElt() {
    for (let field of this.getFields()) {
      await this.appendWidget(field);
    }
  }
};

Sib.register(SibDisplay);
document.createElement('sib-display');