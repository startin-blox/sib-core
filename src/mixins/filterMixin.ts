import { compare, parseFieldsString } from '../libs/helpers';

const FilterMixin = {
  name: 'filter-mixin',
  use: [],
  initialState: {
    searchCount: null,
    idsFounded: false,
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

    //check if solid-form-search has auto-range-[field] attribute
    const autoRangeAttr = Array.from((this.searchForm as Element).attributes)
    .filter(attr => attr['name'].startsWith('auto-range-'))
    
    if (autoRangeAttr.length !== 0) { //if yes, catch field's name field's IDs in each resource in the container
      let autoRangeField = autoRangeAttr.map(item => item['name'].replace('auto-range-', ''));
      for (let field of autoRangeField) { //for each field,catch all elements in 'ldp:contains' key
        let arrayOfDataObjects = this.resource['ldp:contains'];        
        let arrayOfDataIds : string[] = [];
        for (let obj of arrayOfDataObjects) { 
          if (typeof await obj[field] === "object") { // for each element, if it's an object, catch all elements in 'ldp:contains' key 
            let nextArrayOfObjects = await obj[field];
            let nextArrayOfIds = nextArrayOfObjects['ldp:contains'];
            
            if (nextArrayOfIds.length > 0){ // if element(s) in 'ldp:contains', catch each element id 
              for (let obj of nextArrayOfIds) {
                this.idsFounded = true;
                let finalId : string = await obj['@id'];
                arrayOfDataIds.push(finalId);
              }
            }
            if (nextArrayOfIds.length === 0 && this.idsFounded == false) { // if no element in 'ldp:contains', catch object id
              arrayOfDataIds.push(nextArrayOfObjects['@id']);
            }
          } else {
            console.warn(`The format value of ${field} is not suitable with auto-range-[field] attribute`);
            return;
          }
        }
        this.searchForm.component.addAutoRangeValue(field, arrayOfDataIds);
      }; 
    }

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