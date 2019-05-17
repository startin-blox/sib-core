import { store } from '../store.js';
import { stringToDom, evalTemplateString } from '../helpers/index.js';

const ListMixin = {
  name: 'list-mixin',
  use: [],
  initialState: {
    filtersAdded: false,
    currentPage: 1,
    paginationElements: null
  },
  attributes: {
    paginateBy: {
      type: Number,
      default: 0
    },
    counterTemplate: {
      type: String,
      default: null
    },
    searchFields: {
      type: String,
      default: null
    }
  },
  created() {
    this.resourcesFilters.push((resource) => this.matchFilters(resource))
  },
  get pageCount() {
    return Math.max(1, Math.ceil(this.resources.length / this.paginateBy));
  },
  get currentPageResources() {
    if (this.paginateBy == 0) return this.resources;
    const firstElementIndex = (this.currentPage - 1) * this.paginateBy;
    return this.resources.slice(
      firstElementIndex,
      firstElementIndex + this.paginateBy,
    );
  },
  get searchForm() {
    return this.element.querySelector('sib-form');
  },
  get filters() {
    return this.searchForm ? this.searchForm.component.value : {};
  },
  set filters(filters) {
    this.searchForm.component.value = filters;
    this.filterList();
  },
  filterList() {
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
    if (page > this.pageCount) page = this.pageCount;
    this.currentPage = page;
    this.populate();
  },
  renderPaginationNav(div) {
    const paginateBy = this.paginateBy;
    if (this.paginationElements) {
      this.paginationElements.nav.toggleAttribute(
        'hidden',
        paginateBy == 0,
      );
    }
    if (!paginateBy) return;
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
    elements.count.textContent = this.pageCount;
    elements.prev.toggleAttribute('disabled', this.currentPage <= 1);
    elements.next.toggleAttribute('disabled',this.currentPage >= this.pageCount);
    return;
  },
  appendFilters() {
    const searchForm = document.createElement('sib-form');
    (<any>searchForm).component.resource = this.resource;
    searchForm.addEventListener('formChange', () => this.filterList())
    searchForm.setAttribute('data-fields', this.searchFields);
    searchForm.toggleAttribute('naked', true);
    searchForm.addEventListener('input', () => this.currentPage = 1);

    //pass range attributes
    for (let field of (<any>searchForm).component.fields) {
      for (let attr of ['range', 'widget', 'label', 'value']) {
        const value = this.element.getAttribute(`search-${attr}-${field}`);
        if (value == null) continue;
        searchForm.setAttribute(`${attr}-${field}`, value);
      }
    }

    if (this.element.shadowRoot)
      this.element.shadowRoot.insertBefore(searchForm, this.shadowRoot.firstChild);
    else this.element.insertBefore(searchForm, this.element.firstChild);

    setTimeout(() => {
      this.filtersAdded = true;
      this.filterList();
    });
  },
  appendSingleElt(parent) {
    this.appendChildElt(this.resource, parent);
  },
  populate() {
    const div = this.div;

    if (!this.isContainer()) {
      this.appendSingleElt();
      return;
    }
    if (!this.filtersAdded && this.searchFields) {
      this.appendFilters();
      return;
    }

    if (this.counterTemplate) {
      let html: string;
      try {
        html = evalTemplateString(this.counterTemplate, {
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
}

export {
  ListMixin
}