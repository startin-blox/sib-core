import { compare, parseFieldsString } from '../libs/helpers';

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
          this.searchForm.component.detach(this);
          this.searchForm = null;
          this.populate();
        }
      }
    }
  },
  created() {
    this.searchCount = new Map();
    this.element.addEventListener('populate', () => {
      if (!window.document.contains(this.element)) return;
      this.searchForm?.component.updateAutoRanges();
    })
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
    if (subject == null && query.value === '') return true; // filter not set and subject not existing -> ignore filter
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
      let ret = Promise.resolve(query.value === ''); // if no query, return a match
      for (const value of subject['ldp:contains']) {
        ret = await ret || await this.matchValue(value, query)
      }
      return ret;
    }
    return compare[query.type](subject, query.value);
  },
  async matchFilter(resource: object, filter: string, query: any): Promise<boolean> {
    let fields: string[] = [];
    if (this.isSet(filter)) fields = this.getSet(filter);
    else if (this.isSearchField(filter)) fields = this.getSearchField(filter);

    // search on 1 field
    if (fields.length == 0)
      return this.matchValue(await resource[filter], query);

    // search on multiple fields
    return fields.reduce( // return true if it matches at least one of the fields
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
  async getValuesOfField(field: string) {
    const arrayOfDataObjects = this.resource['ldp:contains'];
    const arrayOfDataIds: string[] = [];
    for (const obj of arrayOfDataObjects) {
      // for each element, if it's an object, catch all elements in 'ldp:contains' key
      const nextArrayOfObjects = await obj[field];
      if (!nextArrayOfObjects) continue;

      if (typeof nextArrayOfObjects !== "object") {
        console.warn(`The format value of ${field} is not suitable with auto-range-[field] attribute`);
        continue;
      }

      const nextArrayOfIds = nextArrayOfObjects['ldp:contains'];
      for (const obj of nextArrayOfIds) {
        // catch each element id
        arrayOfDataIds.push(obj['@id']);
      }
      if (nextArrayOfObjects['@type'] !== 'ldp:Container') {
        // if no element in 'ldp:contains', catch object id
        arrayOfDataIds.push(nextArrayOfObjects['@id']);
      }
    }
    return arrayOfDataIds;
  },
  async createFilter(context: string): Promise<void> {
    const filteredBy = this.filteredBy;
    if (filteredBy != null) {
      this.searchForm = document.getElementById(filteredBy)
      if (!this.searchForm) throw `#${filteredBy} is not in DOM`;
    } else {
      this.searchForm = document.createElement(`solid-form-search`);
    }
    this.searchForm.component.attach(this);
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
    await this.searchForm.component.populate();
  },
  // Search fields
  isSearchField(field: string) {
    return this.searchForm.hasAttribute('search-' + field);
  },
  getSearchField(field: string): string[] {
    return parseFieldsString(this.searchForm.getAttribute('search-' + field));
  },
}

export {
  FilterMixin
}