import type { SearchQuery } from '../libs/interfaces';
import { searchInResources } from '../libs/filter';
import type { ServerSearchOptions } from '../libs/store/server-search';
import { SparqlQueryFactory } from '../libs/SparqlQueryFactory';
import { QueryEngine } from '@comunica/query-sparql-link-traversal';

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
      this.dataSrc = "store://local.5e7ab94250757/dataSrc/";
      let results = {
        "@context": "https://cdn.startinblox.com/owl/context.jsonld",
        "@type": "ldp:Container",
        "@id": this.dataSrc,
        "ldp:contains": new Array<any>(),
        "permissions": [
          "view"
        ]
      };
      sibStore.setLocalData(results, this.dataSrc, true);

      const update = async (id: string): Promise<void> => {
        console.log("Update user", id);
        results['ldp:contains'].push({
          "@id": id,
          "@type": "foaf:user"
        });
        sibStore.clearCache(this.dataSrc);
        await sibStore.setLocalData(results, this.dataSrc, true);
      }

      this.engine = new QueryEngine();

      // Set the initial results:
      // - Pick 30 arbitrary users (ex: with skill 1) 
      // - or pick the first 30 users whose name starts with the letter "A".
      // console.log(window.sibStore.getData(this.dataSrcIndex));

      // Find skill index
      const bindingsStream = await this.engine.queryBindings(SparqlQueryFactory.makeSkillMetaIndex(), {
        lenient: true, // ignore HTTP fails
        sources: [this.dataSrcIndex],
      });
  
      let skillMetaIndex = "";
  
      bindingsStream.on('data', (binding: any) => {
        skillMetaIndex = binding.get('result').value;
        console.log(`Found meta skill index ${skillMetaIndex}`);
      });

      await new Promise<void>((resolve, reject) => {
        bindingsStream.on('end', () => resolve());
        bindingsStream.on('error', () => reject());
      });

      const skill = "http://localhost:3000/examples/data/solid-traversal-search/list/skill-2.jsonld";
      const bindingsStream2 = await this.engine.queryBindings(SparqlQueryFactory.makeSkillIndex(skill), {
        lenient: true, // ignore HTTP fails
        sources: [skillMetaIndex],
      });

      let skillIndex = "";

      bindingsStream2.on('data', (binding: any) => {
        skillIndex = binding.get('result').value;
        console.log(`Found skill index ${skillIndex}`);
      });

      await new Promise<void>((resolve, reject) => {
        bindingsStream2.on('end', () => resolve());
        bindingsStream2.on('error', () => reject());
      });

      const bindingsStream3 = await this.engine.queryBindings(SparqlQueryFactory.makeSkill(skill), {
        lenient: true, // ignore HTTP fails
        sources: [skillIndex],
      });

      bindingsStream3.on('data', async (binding: any) => {
        const user = binding.get('result').value;
        console.log(`Found user ${user}`);
        await update(user);
      });

      await new Promise<void>((resolve, reject) => {
        bindingsStream3.on('end', () => resolve());
        bindingsStream3.on('error', () => reject());
      });

      console.log("FILTER INDEX");

      this.searchForm.addEventListener('formChange', (formChangeEvent: any) => {
        // const resource = formChangeEvent.detail.resource;
        // const query = SparqlQueryFactory.make("user", resource);
        // queryEngine.execute(query)
        // console.log(query);

        // initialiser le conteneur avec 10, 20 ou 30 premier users.
        console.log("Filterting form changeEvent", formChangeEvent);

        //setTimeout(() => update("https://api.community.startinblox.com/users/antoine/"), 1000);
        //setTimeout(() => update("https://api.community.startinblox.com/users/gwenle-bars/"), 2000);
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

      if (nextArrayOfObjects['@type'] !== 'ldp:Container') {
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