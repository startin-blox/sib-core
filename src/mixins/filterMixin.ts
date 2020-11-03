import asyncReduce from 'iter-tools/es2015/async-reduce';
import asyncEvery from 'iter-tools/es2015/async-every';
import { compare } from '../libs/helpers';

const FilterMixin = {
  name: 'filter-mixin',
  use: [],
  initialState: {
    searchCount: null,
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
        // if we change search form, re-populate
        if (newValue && this.searchForm && newValue !== this.searchForm.getAttribute('id')) {
          this.searchForm = null;
          this.populate();
        }
      }
    }
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
      if (!this.searchCount.has(context)) this.searchCount.set(context, 1);
      if (!this.searchForm) await this.createFilter(context);
      const filteredResources = await Promise.all(resources.map(this.matchFilters.bind(this)));
      resources =	resources.filter((_v, index) => filteredResources[index]);
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context + (this.searchCount.get(context) || ''));
  },
  async filterList(context: string): Promise<void> {
    this.searchCount.set(context, this.searchCount.get(context) + 1);
    if (!this.resource) return;
    this.empty();
    await this.populate();
  },
  async matchValue(subject, query): Promise<boolean> {
    query.list&&console.log(subject, query.value);
    if (subject == null) return false; // property does not exist on resource

    // Filter on a container
    console.log('q', query, subject);
    
    if (query.list) {
      // if(query.value.length === 0) return true;
      for(const v of query.value) {
        const q = {
          type: query.type,
          value: v,
        }
        console.log(q);
        const match = await this.matchValue(subject, q)
        console.log('match', match);
        
        if(!match) return false;
      }
      return true;
    }
    if (subject.isContainer?.()) {
      return await asyncReduce(
        Promise.resolve(false),
        async (initial, value:any) => await initial || await this.matchValue({ "@id": value['@id'] }, query),
        subject['ldp:contains']
      );
    }
    if(!compare.hasOwnProperty(query.type)) {
      //throw `there is no compare function for type "${query.type}"`;
      // Filter on a nested field
      return await asyncEvery(
        async (index) => await this.matchValue(await subject[index], query[index]),
        Object.keys(query)
      );
    }
    return compare[query.type](subject, query.value);
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
    const filteredBy = this.filteredBy;
    if (filteredBy != null) {
      this.searchForm = document.getElementById(filteredBy)
      if (!this.searchForm) throw `#${filteredBy} is not in DOM`;
    } else {
      this.searchForm = document.createElement(`solid-form-search`);
    }
    this.searchForm.addEventListener('formChange', () => {
      this.filterList(context);
    });
    this.searchForm.toggleAttribute('naked', true);
    if (filteredBy) return;

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