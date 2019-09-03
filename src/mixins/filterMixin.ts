import { ComponentInterface } from "../libs/interfaces.js";

const FilterMixin = {
  name: 'filter-mixin',
  use: [],
  initialState: {
  },
  attributes: {
    searchFields: {
      type: String,
      default: null
    }
  },
  attached(): void {
    this.listPostProcessors.push(this.filterCallback.bind(this));
  },
  get searchForm(): ComponentInterface {
    return this.element.querySelector('sib-form');
  },
  get filters(): object {
    return this.searchForm ? this.searchForm.component.value : {};
  },
  set filters(filters) {
    this.searchForm.component.value = filters;
    this.filterList();
  },
  async filterCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, toExecuteNext: number): Promise<void> {
    if (this.searchFields) {
      if (!this.searchForm) await this.appendFilters();
      resources = resources.filter(this.matchFilters.bind(this));
    }
    this.listPostProcessors[toExecuteNext](resources, listPostProcessors, div, toExecuteNext + 1);
  },
  async filterList(): Promise<void> {
    if (!this.resource) return;
    this.empty();
    await this.populate();
  },
  matchValue(propertyValue, filterValue): boolean {
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
    if (propertyValue.constructor === Object) {
      return Object.keys(filterValue).every(index => this.matchValue(propertyValue[index], filterValue[index]));
    }

    if (typeof propertyValue === 'number') { //check if number
      return propertyValue === Number(filterValue);
    }
    if (typeof propertyValue === 'boolean') { //check if boolean
      const compareValue = (typeof filterValue === "boolean") ?
        filterValue : (filterValue == "true");
      return propertyValue === compareValue;
    }
    if (typeof propertyValue === 'string') { //search in strings
      return (
        propertyValue.toLowerCase().indexOf(String(filterValue).toLowerCase()) !== -1
      );
    }
    return false;
  },
  matchRangeValues(propertyValue, filterValues): boolean | undefined {
    if (propertyValue == null) return false;

    if (typeof propertyValue === 'number' || typeof propertyValue === 'string') {
      return (filterValues[0] ? propertyValue >= filterValues[0] : true) &&
        (filterValues[1] ? propertyValue <= filterValues[1] : true)
    }
    console.warn(`Impossible to filter a ${typeof propertyValue} value with a range widget`)
    return;
  },
  // TODO : to be moved in the store and mutualized with widgetMixin.getValue
  applyFilterToResource(resource: object, filter: string) {
    if (!Array.isArray(filter)) return resource[filter];
    if (filter.length === 0) return;
    if (filter.length === 1) return resource[filter[0]];

    let firstFilter = filter.shift();
    return this.applyFilterToResource(resource[firstFilter], filter);
  },
  matchFilter(resource: object, filter: string, value) {
    if (!this.isSet(filter)) {
      return this.matchValue(this.applyFilterToResource(resource, filter),value);
    }
    // for sets, return true if it matches at least one of the fields
    return this.getSet(filter).reduce(
      (initial, field) => initial || this.matchFilter(resource, field, value),
      false,
    );
  },
  matchFilters(resource: object): boolean {
    //return true if all filters values are contained in the corresponding field of the resource
    return Object.keys(this.filters).reduce(
      (initial, filter) =>
        initial && this.matchFilter(resource, filter, this.filters[filter]),
      true,
    );
  },
  async appendFilters(): Promise<void> {
    const searchForm = document.createElement('sib-form');
    searchForm.addEventListener('formChange', () => this.filterList())
    searchForm.toggleAttribute('naked', true);
    searchForm.addEventListener('input', () => this.setCurrentPage(1)); // TODO : handle dependency

    //pass attributes to search form
    const searchAttributes = Array.from((this.element as Element).attributes)
    .filter(attr => attr['name'].startsWith('search-'))
    .map(attr => ({
      name: attr['name'].replace('search-', ''),
      value: attr['value'],
    }));

    searchAttributes.forEach(({name, value}) => {
      searchForm.setAttribute(name, value);
    });

    this.element.insertBefore(searchForm, this.element.firstChild);

    await (<any>searchForm).component.populate(); // TODO : handle this in search form
  }
}

export {
  FilterMixin
}