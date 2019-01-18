import { store } from '../store.js';
import { stringToDom, evalTemplateString } from '../helpers/index.js';

const SIBListMixin = superclass =>
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
        this.insertBefore(elements.nav, this.div.nextSibling);
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

export default SIBListMixin;
