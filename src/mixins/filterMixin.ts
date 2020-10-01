import asyncReduce from 'iter-tools/es2015/async-reduce';
import asyncEvery from 'iter-tools/es2015/async-every';
import { fuzzyCompare } from '../libs/helpers';

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
    },
    filteredBy: {
      type: String,
      default: null,
      callback(newValue: string) {
        if(this.searchForm && this.searchFormCallback) {
          this.searchForm.removeEventListener('formChange', this.searchFormCallback);
        }
        this.setSearchForm(document.getElementById(newValue));
        this.filterList();
        if (!this.searchForm) throw `#${newValue} is not in DOM`;
      }
    }
  },
  async setSearchForm (elm: Element, context: string) {
    this.searchForm = elm;
    this.searchFormCallback = () => {
      this.filterList(context);
    };
    this.searchForm.addEventListener('formChange', this.searchFormCallback);
  },
  created() {
    this.searchCount = new Map();
  },
  attached(): void {
    this.listPostProcessors.push(this.filterCallback.bind(this));
  },
  get filters(): object {
    return this.searchForm?.component.value ?? {};
  },
  set filters(filters) {
    this.searchForm.component.value = filters;
    this.filterList();
  },
  async filterCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string): Promise<void> {
    if (this.filteredBy || this.searchFields) {
      const searchCount: Map<string, number> = this.searchCount;
      if (!searchCount.has(context)) searchCount.set(context, 1);
      if (!this.searchForm) await this.createFilter(context);
      const filteredResources = await Promise.all(resources.map(this.matchFilters.bind(this)));
      resources =	resources.filter((_v, index) => filteredResources[index]);
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context + (this.searchCount[context] || ''));
  },
  async filterList(context: string): Promise<void> {
    this.searchCount.set(context, this.searchCount.get(context) + 1);
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
    if (propertyValue.isContainer && propertyValue.isContainer()) {
      return await asyncReduce(
        Promise.resolve(false),
        async (initial, value:any) => await initial || await this.matchValue({ "@id": value['@id'] }, filterValue),
        propertyValue['ldp:contains']
      );
    }

    // Filter on a resource
    if (propertyValue['@id']) return propertyValue['@id'] === filterValue;

    // Filter on a nested field
    if (filterValue.constructor === Object) {
      return await asyncEvery(
        async (index) => await this.matchValue(await propertyValue[index], filterValue[index]),
        Object.keys(filterValue)
      );
    }

    // Filter on a value
    const value = propertyValue.toString();
    if(value.toLowerCase().indexOf(String(filterValue).toLowerCase()) !== -1) return true;
    return fuzzyCompare(value, filterValue)
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
      if(value && filter === '@id')
        return await resource[filter] === value;
      return this.matchValue(await resource[filter], value);
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
  async createFilter(context: string): Promise<void> {
    const searchForm = document.createElement('solid-form')
    searchForm.toggleAttribute('naked', true);
    this.setSearchForm(searchForm, context);
    this.searchForm.addEventListener('formChange', this.searchFormCallback);
    this.searchForm.toggleAttribute('naked', true);

    //pass attributes to search form
    const searchAttributes = Array.from((this.element as Element).attributes)
    .filter(attr => attr['name'].startsWith('search-'))
    .map(attr => ({
      name: attr['name'].replace('search-', ''),
      value: attr['value'],
    }));

    searchAttributes.forEach(({name, value}) => {
      this.searchForm.setAttribute(name, value);
    });

    this.element.insertBefore(this.searchForm, this.element.firstChild);
  }
}

export {
  FilterMixin
}