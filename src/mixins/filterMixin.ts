import type { SearchQuery } from '../libs/interfaces';
import { searchInResources } from '../libs/filter';
import type { ServerSearchOptions } from '../libs/store/server-search';
import { SparqlQueryEngineComunica } from '../libs/SparqlQueryEngineComunica';

const enum FilterMode {
  Server = 'server',
  Client = 'client',
  Index = 'index'
};

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
    dataSrcIndex: {
      type: String,
      default: null,
      callback: async function (value: string) {
        console.log("Set index src", value);
      }
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
    },
    filteredOn: {
      type: String, // 'server' | 'client' | 'index'
      default: FilterMode.Client // 'client'
    },
  },
  created() {
    this.searchCount = new Map();
    this.element.addEventListener('populate', () => {
      if (!window.document.contains(this.element)) return;
      this.searchForm?.component.updateAutoRanges();
    })
  },
  async attached(): Promise<void> {
    const filteredBy = this.filteredBy;
    this.searchForm = document.getElementById(filteredBy);

    if (this.dataSrcIndex && this.dataSrcIndex !== "") {
      this.filteredOn = FilterMode.Index;
      if (!filteredBy) throw `#Missing filtered-by attribute`;
      //this.listPostProcessors.push(this.filterCallback.bind(this));
      
      // Create the local container to store search results
      let results = await this.initLocalDataSourceContainerForSearchResults();

      const update = async (id: string): Promise<void> => {
        console.log("Update user", id, results);
        results['ldp:contains'].push({
          "@id": id,
          "@type": "foaf:user"
        });
        sibStore.clearCache(this.dataSrc);
        await sibStore.setLocalData(results, this.dataSrc, true);
        this.element.dataset.src = this.dataSrc;
        console.log("Update user after setLocalData etc", id, results);

        this.empty();
        await this.populate();
      }

      const reset = (): void => {
        results['ldp:contains'] = [];
        sibStore.setLocalData(results, this.dataSrc, true);
      }

      const comunicaEngine = new SparqlQueryEngineComunica(this.dataSrcIndex, update, reset);
      comunicaEngine.searchFromSearchForm(); // no filter = default case
      console.log("Search by location for Paris", this.dataSrcIndex, this.dataSrc, results, this);

      this.searchForm.addEventListener('submit', async (submitEvent: any) => {
        results['ldp:contains'] = []; // empty the previous results
        const filterValues = submitEvent.target.parentElement.component.value;
        comunicaEngine.searchFromSearchForm(filterValues);
      });
    }

    else if (this.isFilteredOnServer() && filteredBy) {
      if (!this.searchForm) throw `#${filteredBy} is not in DOM`;
      // this.searchForm.component.attach(this); // is it necessary?
      this.searchForm.addEventListener('formChange', () => this.onServerSearchChange());
    } 
    
    else {
      this.listPostProcessors.push(this.filterCallback.bind(this));
    }
  },
  get filters(): SearchQuery {
    return this.searchForm?.component?.value ?? {};
  },
  set filters(filters) {
    if (this.searchForm?.component?.value) {
      this.searchForm.component.value = filters;
      this.filterList();
    }
  },
  async initLocalDataSourceContainerForSearchResults(): Promise<any> {
    const idField = Array.from(Array(20), () => Math.floor(Math.random() * 36).toString(36)).join('');
    // const id = `store://local.${idField}`;
    console.log("Init local data source container for search results", idField);
    this.dataSrc = `store://local.${idField}/dataSrc/`;
    const results = {
      "@context": "https://cdn.happy-dev.fr/owl/hdcontext.jsonld",
      "@type": "ldp:Container",
      "@id": this.dataSrc,
      "ldp:contains": new Array<any>(),
      "permissions": [
        "view"
      ]
    };
    await sibStore.setLocalData(results, this.dataSrc);
    return results;
  },
  isFilteredOnServer() {
    return this.filteredOn === FilterMode.Server && !!this.fetchData;
  },
  async onServerSearchChange() {
    await this.fetchData(this.dataSrc);
    this.empty();
    await this.populate();
  },
  getDynamicServerSearch(): ServerSearchOptions | undefined {
    const filters = this.filters;
    if (this.isFilteredOnServer() && filters) {
      const fields = Object.keys(filters);
      const value = (Object.values(filters) as { value: string }[])
        .map(({ value }) => value)
        .filter((value) => !!value)
        .join(' ').trim();
      if (fields.length > 0 && value) {
        return { fields, value };
      }
    }
    return;
  },
  async filterCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string): Promise<void> {
    if (this.filteredBy || this.searchFields) {
      if (!this.searchCount.has(context)) this.searchCount.set(context, 1);
      if (!this.searchForm) await this.createFilter(context);
      const filteredResources = await searchInResources(
        resources,
        this.filters,
        this.fields,
        this.searchForm
      );
      resources = resources.filter((_v, index) => filteredResources[index]);
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor) await nextProcessor(resources, listPostProcessors, div, context + (this.searchCount.get(context) || ''));
  },
  async filterList(context: string): Promise<void> {
    this.searchCount.set(context, this.searchCount.get(context) + 1);
    if (!this.resource) return;
    this.empty();
    await this.populate();
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

      if (!nextArrayOfObjects.isContainer()) {
        // if no element in 'ldp:contains', catch object id
        arrayOfDataIds.push(nextArrayOfObjects['@id']);
      } else {
        if (!nextArrayOfObjects['ldp:contains']) continue;
        for (const obj of nextArrayOfObjects['ldp:contains']) {
          // catch each element id
          arrayOfDataIds.push(obj['@id']);
        }
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

    searchAttributes.forEach(({ name, value }) => {
      this.searchForm.setAttribute(name, value);
    });

    this.element.insertBefore(this.searchForm, this.element.firstChild);
    await this.searchForm.component.populate();
  },
}

export {
  FilterMixin
}