//@ts-ignore
import asyncFilter from 'https://dev.jspm.io/iter-tools/es2018/async-filter';
//@ts-ignore
import asyncReduce from 'https://dev.jspm.io/iter-tools/es2018/async-reduce';
//@ts-ignore
import asyncEvery from 'https://dev.jspm.io/iter-tools/es2018/async-every';
import { ComponentInterface } from "../libs/interfaces.js";

const FilterMixin = {
  name: 'filter-mixin',
  use: [],
  initialState: {
    searchCount: [],
  },
  attributes: {
    searchFields: {
      type: String,
      default: null
    }
  },
  created() {
    this.searchCount = [];
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
  async filterCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string): Promise<void> {
    if (this.searchFields) {
      if (!this.searchCount[context]) this.searchCount[context] = 1;
      if (!this.searchForm) await this.appendFilters(context);
      resources = await asyncFilter(2, this.matchFilters.bind(this), resources);
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context + (this.searchCount[context] || ''));
  },
  async filterList(context: string): Promise<void> {
    this.searchCount[context] ++;
    if (!this.resource) return;
    this.empty();
    await this.populate();
  },
  async matchValue(propertyValue, filterValue): Promise<boolean> {
    if (Array.isArray(filterValue)) return this.matchRangeValues(propertyValue, filterValue); // multiple filters -> range
    if (JSON.stringify(filterValue).includes('""')) return true; // filter empty, no filter set
    if (propertyValue == null) return false; // property does not exist on resource
    if (filterValue['@id']) filterValue = filterValue['@id']; // if filter has id (dropdown), use it to filter

    // Filter on a container
    if (propertyValue.isContainer && await propertyValue.isContainer()) {
      return await asyncReduce(
        Promise.resolve(false),
        async (initial, value) => await initial || await this.matchValue({ "@id": value['@id'] }, filterValue),
        propertyValue['ldp:contains']
      );
    }

    // Filter on a resource
    if (propertyValue['@id'] && propertyValue['@id'] === filterValue) return true;

    // Filter on a nested field
    if (filterValue.constructor === Object) {
      return await asyncEvery(
        async (index) => await this.matchValue(await propertyValue[index], filterValue[index]),
        Object.keys(filterValue)
      );
    }

    // Filter on a value
    const value = propertyValue.toString();
    return value.toLowerCase().indexOf(String(filterValue).toLowerCase()) !== -1;
  },
  matchRangeValues(propertyValue, filterValues): boolean | undefined {
    const propertyValueString = propertyValue ? propertyValue.toString() : null;
    if (!propertyValueString) return false;

    // Cast to number if possible
    const propertyValueNumber = Number(propertyValueString);
    propertyValue = !isNaN(propertyValueNumber) ? propertyValueNumber : propertyValueString;

    if (typeof propertyValue == "string" || typeof propertyValue == "number") {
      return (filterValues[0] ? propertyValue >= filterValues[0] : true) &&
        (filterValues[1] ? propertyValue <= filterValues[1] : true)
    }
    console.warn(`Impossible to filter a ${typeof propertyValue} value with a range widget`)
    return;
  },
  async matchFilter(resource: object, filter: string, value: any): Promise<boolean> {
    if (!this.isSet(filter)) {
      return this.matchValue(await resource[filter],value);
    }
    // for sets, return true if it matches at least one of the fields
    return this.getSet(filter).reduce(
      async (initial, field) => await initial || await this.matchFilter(resource, field, value),
      Promise.resolve(false),
    );
  },
  async matchFilters(resource: object): Promise<boolean> {
    //return true if all filters values are contained in the corresponding field of the resource
    return Object.keys(this.filters).reduce(
      async (initial, filter) =>
        await initial && await this.matchFilter(resource, filter, this.filters[filter]),
      Promise.resolve(true)
    );
  },
  async appendFilters(context: string): Promise<void> {
    const searchForm = document.createElement('sib-form');
    searchForm.addEventListener('formChange', () => this.filterList(context))
    searchForm.toggleAttribute('naked', true);

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
  }
}

export {
  FilterMixin
}