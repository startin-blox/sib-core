import { store } from '../store.js';
import { stringToDom, evalTemplateString } from '../helpers/index.js';

const ListMixin = {
  name: 'list-mixin',
  use: [],
  initialState: {
    filters: {},
    filtersAdded: false,
    currentPage: 1,
    searchForm: null,
    paginationElements: null
  },
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
  setCurrentPage(page: number) {
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
  renderPaginationNav(div) {
    const paginateBy = this.paginateBy;
    if (this.paginationElements) {
      this.paginationElements.nav.toggleAttribute(
        'hidden',
        paginateBy == null,
      );
    }
    if (paginateBy == null) return;
    if (!this.paginationElements) {
      const elements = (this.paginationElements = {});
      const nav = stringToDom(/*html*/ `<nav data-id='nav'>
      <button data-id="prev">←</button>
      <button data-id="next">→</button>
      <span>
      <span data-id="current">0</span>
      / <span data-id="count">0</span>
      </span>
      </nav>`);
      nav.querySelectorAll('[data-id]').forEach(elm => {
        const id = elm.getAttribute('data-id');
        elm.removeAttribute('data-id')
        if(id) elements[id] = elm;
      });
      this.element.insertBefore(elements['nav'], div.nextSibling);
      elements['prev'].addEventListener('click', () => {
        this.currentPage -= 1;
        this.empty();
        this.populate();
      });
      elements['next'].addEventListener('click', () => {
        this.currentPage += 1;
        this.empty();
        this.populate();
      });
    }
    const elements = this.paginationElements;
    elements.current.textContent = this.currentPage;
    elements.count.textContent = this.getPageCount();
    elements.prev.toggleAttribute('disabled', this.currentPage <= 1);
    elements.next.toggleAttribute('disabled',this.currentPage >= this.getPageCount());
    return;
  },
  /*get resources() {
    return this.resources.filter(this.matchFilters.bind(this)); // TODO : check that
  },*/
  appendFilters() {
    this.searchForm = document.createElement('sib-form');
    this.searchForm.resource = this.resource;
    this.searchForm.save = this.filterList.bind(this);
    this.searchForm.change = this.filterList.bind(this);
    this.searchForm.dataset.fields = this.element.getAttribute('search-fields');
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
        const value = this.element.getAttribute(`search-${attr}-${field}`);
        if (value == null) continue;
        this.searchForm.setAttribute(`${attr}-${field}`, value);
        if(field && attr == "value") filters[field] = value;
      }
    }

    if (this.element.shadowRoot)
      this.element.shadowRoot.insertBefore(this.searchForm, this.shadowRoot.firstChild);
    else this.element.insertBefore(this.searchForm, this.firstChild);

    this.filtersAdded = true;
    this.filters = filters;
  },
  appendSingleElt(parent) {
    this.appendChildElt(this.resource, parent);
  },
  filterList() {
    this.filters = this.searchForm.value;
  },
  populate() {
    const div = this.getDiv();

    if (!this.isContainer()) {
      this.appendSingleElt();
      return;
    }
    if (!this.filtersAdded && this.element.hasAttribute('search-fields')) {
      this.appendFilters();
      return;
    }

    if (this.counterTemplate) {
      let html: string;
      try {
        html = evalTemplateString(this.element.getAttribute('counter-template'), {
          counter: this.resources.length,
        });
      } catch (e) {
        console.error(new Error('error in counter-template'), e);
        throw e;
      }
      if (!this.counter) {
        this.counter = document.createElement('div');
        this.element.insertBefore(this.counter, div);
      }
      this.counter.innerHTML = '';
      this.counter.appendChild(stringToDom(html));
    }
    this.renderPaginationNav(div);

    for (let resource of this.resources) {
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

export {
  ListMixin
}