import { store } from '../store.js';
import { stringToDom, evalTemplateString } from '../helpers/index.js';

const SIBListMixin = superclass =>
  class extends superclass {
    constructor() {
      super();
      this._filters = {};
      this._filtersAdded = false;
      this._currentPage = 1;
      this.searchForm;
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
      if (Array.isArray(filterValue)) return this.matchRangeValues(propertyValue, filterValue)
      if (JSON.stringify(filterValue).includes('""')) return true;
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
      if (propertyValue['@id'] && propertyValue['@id'] === filterValue) return true;
      if(propertyValue.constructor === Object) {
        
        return Object.entries(filterValue).every(([k,v]) => this.matchValue(propertyValue[k], v));
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
    }

    matchRangeValues(propertyValue, filterValues) {
      if (propertyValue == null) return false;

      if (typeof propertyValue === 'number' || typeof propertyValue === 'string') {
        return (filterValues[0] ? propertyValue >= filterValues[0] : true) &&
          (filterValues[1] ? propertyValue <= filterValues[1] : true)
      }
      console.warn(`Impossible to filter a ${typeof propertyValue} value with a range widget`)
    }

    // TODO : to be moved in the store and mutualized with widgetMixin.getValue
    applyFilterToResource(resource, filter) {
      if (!Array.isArray(filter)) return resource[filter];
      if (filter.length === 0) return;
      if (filter.length === 1) return resource[filter[0]];

      let firstFilter = filter.shift();
      return this.applyFilterToResource(resource[firstFilter], filter);
    }

    matchFilter(resource, filter, value) {
      if (!this.isSet(filter)) {
        return this.matchValue(this.applyFilterToResource(resource, filter),value);
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
      return Math.max(1, Math.ceil(this.resources.length / this.paginateBy));
    }
    get currentPageResources() {
      if (this.paginateBy == null) return this.resources;
      const firstElementIndex = (this.currentPage - 1) * this.paginateBy;
      return this.resources.slice(
        firstElementIndex,
        firstElementIndex + this.paginateBy,
      );
    }

    renderPaginationNav(div) {
      const paginateBy = this.paginateBy;
      if (this._paginationElements) {
        this._paginationElements.nav.toggleAttribute(
          'hidden',
          paginateBy == null,
        );
      }
      if (paginateBy == null) return;
      if (!this._paginationElements) {
        const elements = (this._paginationElements = {});
        const nav = stringToDom(/*html*/ `<nav data-id='nav'>
        <button data-id="prev">←</button>
        <button data-id="next">→</button>
        <span>
        <span data-id="current">0</span>
        / <span data-id="count">0</span>
        </span>
        </nav>`);
        nav.querySelectorAll('[data-id]').forEach(elm => {
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
        });
      }
      const elements = this._paginationElements;
      elements.current.textContent = this.currentPage;
      elements.count.textContent = this.pageCount;
      elements.prev.toggleAttribute('disabled', this.currentPage <= 1);
      elements.next.toggleAttribute('disabled',this.currentPage >= this.pageCount);
      return;
    }

    get resources() {
      return super.resources.filter(this.matchFilters.bind(this));
    }

    filterList() {
      this.filters = this.searchForm.value;
    }

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

      this._filtersAdded = true;
      this.filters = filters;
    }

    appendSingleElt(parent) {
      this.appendChildElt(this.resource, parent);
    }

    populate() {
      const div = this.div // make sure we always insert datas in the right div

      if (!this.isContainer) {
        this.appendSingleElt(div);
        return;
      }
      if (!this._filtersAdded && this.hasAttribute('search-fields')) {
        this.appendFilters();
        return;
      }

      if (this.hasAttribute('counter-template')) {
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

      for (let resource of this.currentPageResources) {
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
  };

export default SIBListMixin;
