import asyncReduce from 'iter-tools/es2015/async-reduce';
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
    if (subject === undefined && query.value === '') return true; // filter not set and subject not existing -> ignore filter
    if (subject == null) return false; // property does not exist on resource
    // Filter on a container
    if (query.list) {
      if(query.value.length === 0) return true;
      for(const v of query.value) {
        const q = {
          type: query.type,
          value: v,
        }
        if(await this.matchValue(subject, q)) return true;
      }
      return false;
    }
    if (subject.isContainer?.()) {
      return await asyncReduce(
        Promise.resolve(query.value === ''), // if no query, return a match
        async (initial, value:any) => await initial || await this.matchValue(value, query),
        subject['ldp:contains'],
      );
    }
    return compare[query.type](subject, query.value);
  },
  async matchFilter(resource: object, filter: string, query: any): Promise<boolean> {
    if (!this.isSet(filter))
      return this.matchValue(await resource[filter], query);
    // for sets, return true if it matches at least one of the fields
    return this.getSet(filter).reduce(
      async (initial, field) => await initial || await this.matchFilter(resource, field, query),
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