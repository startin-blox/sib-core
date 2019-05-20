const FilterMixin = {
  name: 'filter-mixin',
  use: [],
  initialState: {
    filtersAdded: false
  },
  attributes: {
    searchFields: {
      type: String,
      default: null
    }
  },
  created() {
    this.resourcesFilters.push((resource) => this.matchFilters(resource))
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
  appendFilters() {
    const searchForm = document.createElement('sib-form');
    (<any>searchForm).component.resource = this.resource;
    searchForm.addEventListener('formChange', () => this.filterList())
    searchForm.setAttribute('data-fields', this.searchFields);
    searchForm.toggleAttribute('naked', true);
    searchForm.addEventListener('input', () => this.setCurrentPage(1));

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
  }
}

export {
  FilterMixin
}