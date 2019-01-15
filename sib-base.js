import { base_context, store } from './store.js';
import { stringToDom, evalTemplateString } from './helpers.js';

export class SIBBase extends HTMLElement {
  static get observedAttributes() {
    return ['data-src'];
  }

  get extra_context() {
    return {};
  }

  get context() {
    return { ...base_context, ...this.extra_context };
  }

  toggleLoaderHidden(toggle) {
    if (this.hasAttribute('loader-id')) {
      document
        .getElementById(this.getAttribute('loaderId'))
        .toggleAttribute('hidden', toggle);
    }
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (attribute !== 'data-src') return;

    this.empty();

    // brings a loader out if the attribute is set
    this.toggleLoaderHidden(false);

    if (!newValue) return;

    // gets the data through the store
    store.get(newValue + this.idSuffix, this.context).then(resource => {
      this.empty();
      this.resource = resource;
      this.populate();
      this.toggleLoaderHidden(true);
    });
  }

  populate() {
    //this method should be implemented by descending components to insert content
    throw 'Not Implemented';
  }

  empty() {
    //this method should be implemented by descending components to remove all content
    throw 'Not Implemented';
  }

  connectedCallback() {
    if (this.resource) this.populate();
  }

  get isContainer() {
    return 'ldp:contains' in this.resource;
  }

  get next() {
    return this.getAttribute('next');
  }

  get idSuffix() {
    // attribute added to the id given as data-src
    if (this.hasAttribute('id-suffix'))
      return this.getAttribute('id-suffix') + '/';
    else return '';
  }

  get resources() {
    if (!this.isContainer) return [];
    if (Array.isArray(this.resource['ldp:contains']))
      return this.resource['ldp:contains'];
    return [this.resource['ldp:contains']];
  }
}

export const SIBWidgetMixin = superclass =>
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
      return fields.split(',').map(s => s.trim().split(/\./));
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
      if (Object.keys(resource).length <= 1) {
        resource = await store.get(resource);
      }
      return resource[field];
    }

    async getValue(field) {
      if (this.hasAttribute('value-' + field))
        return this.getAttribute('value-' + field);

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

    getWidget(field) {
      const value = this.getAttribute('widget-' + field.join('.'));
      return value || this.defaultWidget;
    }

    async widgetAttributes(field) {
      return {
        value: await this.getValue(field),
        name: field,
      };
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
        div.setAttribute('name', field);
        parent.appendChild(div);
        for (let item of this.getSet(field)) await this.appendWidget(item, div);
        return;
      }
      let widget;
      let attributes;

      widget = document.createElement(this.getWidget(field));
      attributes = await this.widgetAttributes(field);
      for (let name of Object.keys(attributes)) widget[name] = attributes[name];
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
          value,
        });
      } catch (e) {
        console.error(new Error(`error in template#${id}`), e);
        throw e;
      }
      return stringToDom(html);
    }
  };

export const SIBListMixin = superclass =>
  class extends superclass {
    constructor() {
      super();
      this._filters = {};
      this._filtersAdded = false;
      this._currentPage = 1;
    }

    get filters() {
      return this._filters;
    }

    set filters(filters) {
      this._filters = filters;
      if (!this.resource) return;
      this.empty();
      this.populate();
    }

    matchValue(propertyValue, filterValue) {
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
      if (typeof propertyValue === 'number') {
        //check if integer match
        return propertyValue === filterValue;
      }
      if (typeof propertyValue === 'string') {
        //search in strings
        return (
          propertyValue.toLowerCase().indexOf(filterValue.toLowerCase()) !== -1
        );
      }
      return false;
    }

    applyFilterToResource(resource, filter) {
      if (!Array.isArray(filter)) return resource[filter];
      if (filter.length === 0) return;
      if (filter.length === 1) return resource[filter[0]];

      let firstFilter = filter.shift();
      return this.applyFilterToResource(resource[firstFilter], filter);
    }

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
    }

    matchFilters(resource) {
      //return true if all filters values are contained in the corresponding field of the resource
      return Object.keys(this.filters).reduce(
        (initial, filter) =>
          initial && this.matchFilter(resource, filter, this.filters[filter]),
        true,
      );
    }

    get paginateBy() {
      let pagination = this.getAttribute('paginate-by');
      if (!pagination) return;
      pagination = Number.parseInt(pagination, 10);
      if (Number.isNaN(pagination)) return;
      return pagination;
    }
    get currentPage() {
      return this._currentPage;
    }
    set currentPage(page) {
      if (page < 1) page = 1;
      if (page > this.pageCount) page = this.pageCount;
      this._currentPage = page;
      this.populate;
    }
    get pageCount() {
      return Math.ceil(this.resources.length / this.paginateBy);
    }
    get currentPageResources() {
      if (this.paginateBy == null) return this.resources;
      const firstElementIndex = (this.currentPage - 1) * this.paginateBy;
      return this.resources.slice(
        firstElementIndex,
        firstElementIndex + this.paginateBy,
      );
    }

    renderPaginationNav() {
      const paginateBy = this.paginateBy;
      if (this.paginationNav) {
        this.paginationNav.toggleAttribute('hidden', paginateBy == null);
      }
      if (paginateBy == null) return;
      if (!this.paginationNav) {
        this.paginationNav = stringToDom(/*html*/ `<nav>
        <button class="pagination-prev">←</button>
        <button class="pagination-next">→</button>
        <span>
        <span class="pagination-current-page">0</span>
        / <span class="pagination-page-count">0</span>
        </span>
        </nav>`).firstChild;
        this.insertBefore(this.paginationNav, this.div.nextSibling);
        this.paginationNav.addEventListener('click', ({ target }) => {
          if (target.tagName !== 'BUTTON') return;
          const pageOffset = target.classList.contains('pagination-prev')
            ? -1
            : 1;
          this.currentPage += pageOffset;
          this.empty();
          this.populate();
        });
      }
      this.paginationNav.querySelector(
        '.pagination-current-page',
      ).textContent = this.currentPage;
      this.paginationNav.querySelector(
        '.pagination-page-count',
      ).textContent = this.pageCount;
      return;
    }

    get resources() {
      return super.resources.filter(this.matchFilters.bind(this));
    }

    filterList(filters) {
      this.filters = filters;
    }

    appendFilters() {
      const formElt = document.createElement('sib-form');
      formElt.resource = this.resource;
      formElt.save = this.filterList.bind(this);
      formElt.change = this.filterList.bind(this);
      formElt.dataset.fields = this.getAttribute('search-fields');
      formElt.setAttribute('reset', '');

      //displays applied filter values in the form
      for (let filter of Object.keys(this.filters)) {
        if (formElt.dataset.fields.indexOf(filter) != -1) {
          formElt.setAttribute('value-' + filter, this.filters[filter]);
        }
      }
      //pass range attributes
      for (let field of formElt.fields) {
        for (let attr in ['range', 'widget', 'label']) {
          const value = this.getAttribute(`search-${attr}-${field}`);
          if (value == null) continue;
          formElt.setAttribute(`${attr}-${field}`, value);
        }
      }

      if (this.shadowRoot)
        this.shadowRoot.insertBefore(formElt, this.shadowRoot.firstChild);
      else this.insertBefore(formElt, this.firstChild);

      this._filtersAdded = true;
    }

    appendSingleElt() {
      this.appendChildElt(this.resource);
    }

    populate() {
      if (!this.isContainer) {
        this.appendSingleElt();
        return;
      }
      if (!this._filtersAdded && this.hasAttribute('search-fields')) {
        this.appendFilters();
      }

      if (this.hasAttribute('counter-template')) {
        let html;
        try{
          html = evalTemplateString(this.getAttribute('counter-template'), {
            counter: this.resources.length,
          });
        } catch(e) {
          console.error(new Error('error in counter-template'), e);
          throw e;
        }
        if (!this.counter) {
          this.counter = document.createElement('div');
          this.insertBefore(this.counter, this.div);
        }
        this.counter.innerHTML = '';
        this.counter.appendChild(stringToDom(html));
      }
      this.renderPaginationNav();

      if (this.fields.length <= 0) return;
      for (let resource of this.currentPageResources) {
        //for federations, fetch every sib:source we find
        if (resource['@type'] !== 'sib:source') {
          this.appendChildElt(resource);
          continue;
        }
        store.get(resource.container).then(container => {
          for (let resource of container['ldp:contains']) {
            this.appendChildElt(resource);
          }
        });
      }
    }
  };

export class SIBACChecker extends SIBBase {
  get extra_context() {
    return {
      acl: 'http://www.w3.org/ns/auth/acl#',
      permissions: 'acl:accessControl',
      mode: 'acl:mode',
    };
  }

  get permission() {
    return this.getAttribute('permission') || 'view';
  }

  populate() {
    for (let permission of this.resource.permissions) {
      if (permission.mode === this.permission) {
        this.removeAttribute('hidden');
      }
    }
  }

  empty() {
    this.setAttribute('hidden', '');
  }
}

customElements.define('sib-ac-checker', SIBACChecker);
