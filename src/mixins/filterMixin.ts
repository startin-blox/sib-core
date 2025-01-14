import type { PostProcessorRegistry } from '../libs/PostProcessorRegistry.ts';
// import { SparqlQueryEngineComunica } from '../libs/SparqlQueryEngineComunica.ts';
import { searchInResources } from '../libs/filter.ts';
import type { SearchQuery } from '../libs/interfaces.ts';
import type { ServerSearchOptions } from '../libs/store/server-search.ts';
import { parseFieldsString } from '../libs/helpers.ts';

import process from 'process';

import semantizer from "@semantizer/default";
import type { DatasetSemantizer } from "@semantizer/types";
import { solidWebIdProfileFactory } from "@semantizer/mixin-solid-webid";
import indexFactory, { indexShapeFactory } from "@semantizer/mixin-index";

// The index strategies: two choices, use a default algorithm by Maxime or use a SPARQL query with Comunica
import IndexStrategyConjunction from "@semantizer/mixin-index-strategy-conjunction";
// import IndexStrategySparqlComunica from "@semantizer/mixin-index-strategy-sparql-comunica";


enum FilterMode {
  Server = 'server',
  Client = 'client',
  Index = 'index',
}

enum IndexType {
  Index = 'https://ns.inria.fr/idx/terms#Index'
}

const FilterMixin = {
  name: 'filter-mixin',
  use: [],
  initialState: {
    searchCount: null,
  },
  attributes: {
    searchFields: {
      type: String,
      default: null,
    },
    dataSrcIndex: {
      type: String,
      default: null,
      callback: (value: string) => {
        console.log('Set index src', value);
      },
    },
    filteredBy: {
      type: String,
      default: null,
      callback(newValue: string) {
        // if we change search form, re-populate
        if (
          newValue &&
          this.searchForm &&
          newValue !== this.searchForm.getAttribute('id')
        ) {
          this.searchForm.component.detach(this);
          this.searchForm = null;
          this.populate();
        }
      },
    },
    filteredOn: {
      type: String, // 'server' | 'client' | 'index'
      default: FilterMode.Client, // 'client'
    },
  },
  created() {
    this.searchCount = new Map();
    this.element.addEventListener('populate', () => {
      if (!window.document.contains(this.element)) return;
      this.searchForm?.component.updateAutoRanges();
    });
  },
  async attached(): Promise<void> {
    const filteredBy = this.filteredBy;

    if (this.dataSrcIndex && this.dataSrcIndex !== '') {
      this.searchForm = document.getElementById(filteredBy);
      this.filteredOn = FilterMode.Index;
      if (!filteredBy) throw '#Missing filtered-by attribute';
      //this.listPostProcessors.push(this.filterCallback.bind(this));

      // Create the local container to store search results
      await this.initLocalDataSourceContainerForSearchResults();

      // this.updateContainer = this.updateContainer.bind(this);
      const update = async (id: string): Promise<void> => {
        console.log('Update user', id, this.localResources);
        this.localResources['ldp:contains'].push({
          '@id': id,
          '@type': 'foaf:user',
        });
        sibStore.clearCache(this.dataSrc);
        this.element.dataset.src = this.dataSrc;
        console.log('Update user after setLocalData etc', id, this.localResources);

        await sibStore.setLocalData(this.localResources, this.dataSrc, true);
        this.populate();
      };

      const reset = (): void => {
        this.empty();
        this.localResources['ldp:contains'] = [];
        sibStore.setLocalData(this.localResources, this.dataSrc, true);
      };

      console.log('Init index based search', this.dataSrcIndex);
      this.buildShape([]);
      // .then((result) => {
      //   console.log('Result', result);
      //   this.localResources['ldp:contains'] = result;
      //   sibStore.setLocalData(this.localResources, this.dataSrc, true);
      //   this.populate();
      // });

      // this.comunicaEngine = new SparqlQueryEngineComunica(
      //   this.dataSrcIndex,
      //   update,
      //   reset,
      // );
      // this.comunicaEngine.searchFromSearchForm(); // no filter = default case
      console.log(
        'Search by location for Paris',
        this.dataSrcIndex,
        this.dataSrc,
        this.localResources,
        this,
      );

      this.searchForm.addEventListener('submit', this.onIndexSearch.bind(this));
      this.listPostProcessors.push(this.applyPostProcessors.bind(this));
    } else if (this.isFilteredOnServer() && filteredBy) {
      this.searchForm = document.getElementById(filteredBy);

      if (!this.searchForm) throw `#${filteredBy} is not in DOM`;
      // this.searchForm.component.attach(this); // is it necessary?
      this.searchForm.addEventListener('formChange', () =>
        this.onServerSearchChange(),
      );
    } else {
      this.listPostProcessors.attach(
        this.filterCallback.bind(this),
        'FilterMixin:filterCallback',
      );
    }
  },
  isIndexBasedSearch(): boolean {
    return this.filteredOn === FilterMode.Index && this.dataSrcIndex;
  },
  onIndexSearch(submitEvent: any): void {
    this.localResources['ldp:contains'] = []; // empty the previous results
    console.log('Index search', submitEvent);
    sibStore.setLocalData(this.localResources, this.dataSrc, true);
    if (this.loader) {
      console.log('Toggle loader hidden', this.loader);
      this.loader.toggleAttribute('hidden', false);
    }

    const filterValues = submitEvent.target.parentElement.component.value;
    console.log('Filter values', filterValues);

    // this.comunicaEngine.searchFromSearchForm(filterValues);
    this.buildShape(filterValues);
  },
  async buildShape(filterValues: []) {
      console.log('Build shape', filterValues);
      // // 1. Load the WebId of the instance
      const appIdProfile = await semantizer.load(this.dataSrcIndex, solidWebIdProfileFactory);
      // await appIdProfile.loadExtendedProfile();
      const appId = appIdProfile.getPrimaryTopic();

      // 2. Get the public type index
      const publicTypeIndex = appId.getPublicTypeIndex();

      if (!publicTypeIndex) {
          throw new Error("The TypeIndex was not found.");
      }

      await publicTypeIndex.load();

      // 3. Find the index from the TypeIndex
      const indexDataset = publicTypeIndex.getRegisteredInstanceForClass(IndexType.Index);

      if (!indexDataset) {
          throw new Error("The meta-meta index was not found.");
      }
      console.log('Index dataset', indexDataset);

      // 4. Build the index mixin
      const index = semantizer.build(indexFactory, indexDataset);

      // 5. Construct the shape by iterating over fields from the component and resolving their predicate names
      // and get the associated filter values for each of them and add them as pattern
      // How to differentiate between pattern and value properties?

      const shape = semantizer.build(indexShapeFactory);
      const dataFactory = semantizer.getConfiguration().getRdfDataModelFactory();

      // How can we know the type of the shape from the component configuration ?
      // Or should actually the shape be a static configuration object for the component itself ?
      shape.addTargetRdfType(dataFactory.namedNode("http://cdn.startinblox.com/owl/ttl/vocab.ttl#User"));

      // console.log('Fields', this.fields);
      // const fields = parseFieldsString(this.searchFields);
      console.log('Fields after parsing', filterValues);
      for (const filter of filterValues) {
        console.log(
          filter,
          this.element.querySelector(`[name="${filter}"] input`).value,
        );
        const valuesArray = parseFieldsString(
          this.element.querySelector(`[name="${filter}"] input`).value,
        );
        for (const value of valuesArray) {
          if (value) {
            shape.addPatternProperty(
              dataFactory.namedNode(`http://cdn.startinblox.com/owl/ttl/vocab.ttl#${filter}`),
              dataFactory.literal(value)
            );
          }
        }
      }
      console.log('Shape after iterating on the fields', shape);
      // shape.addPatternProperty(
      //     dataFactory.namedNode("http://cdn.startinblox.com/owl/ttl/vocab.ttl#firstName"),
      //     dataFactory.literal("adr.*")
      // );

      // shape.addValueProperty(
      //     dataFactory.namedNode("http://cdn.startinblox.com/owl/ttl/vocab.ttl#city"),
      //     dataFactory.literal("paris")
      // );

      shape.addValueProperty(
          dataFactory.namedNode("http://cdn.startinblox.com/owl/ttl/vocab.ttl#skills"),
          dataFactory.namedNode("https://api.test-inria2.startinblox.com/skills/2/")
      );

      console.log('Shape', shape);
      const strategy = new IndexStrategyConjunction(shape);
      // const resultCallback = ((user: DatasetSemantizer) => {
      //   console.log("!!! RESULT !!! ", user.getOrigin()?.value);
      //   if (user.getOrigin()?.value)
      //     result.push(user.getOrigin()?.value!);

      //   console.log('Result', result);
      //   this.localResources['ldp:contains'] = result;
      //   sibStore.setLocalData(this.localResources, this.dataSrc, true);
      //   this.populate();
      // });
      console.log('Strategy', strategy);
      await index.findTargetsRecursively(strategy, (...args) => this.updateContainer(...args), 30);
  },
  async updateContainer(user: DatasetSemantizer) {
    console.log('Update container', user, this.localResources);
    // this.localResources['ldp:contains'] = [];
    console.log("!!! RESULT !!! ", user.getOrigin()?.value);
    console.log('Result this in callback function', this);
    if (user.getOrigin()?.value) {
      this.localResources['ldp:contains'].push({
        '@id': user.getOrigin()?.value!,
        '@type': 'foaf:user',
      });
    }

    console.log('Result', this.localResources);
    sibStore.setLocalData(this.localResources, this.dataSrc, true);
    this.populate();
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
    const idField = Array.from(Array(20), () =>
      Math.floor(Math.random() * 36).toString(36),
    ).join('');
    // const id = `store://local.${idField}`;
    console.log('Init local data source container for search results', idField);
    this.dataSrc = `store://local.${idField}/dataSrc/`;
    this.localResources = {
      '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
      '@type': 'ldp:Container',
      '@id': this.dataSrc,
      'ldp:contains': new Array<any>(),
      permissions: ['view'],
    };
    console.log('Resources right after initialization', this.localResources);
    await sibStore.setLocalData(this.localResources, this.dataSrc);
    if (this.loader) this.loader.toggleAttribute('hidden', true);
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
        .filter(value => !!value)
        .join(' ')
        .trim();
      if (fields.length > 0 && value) {
        return { fields, value };
      }
    }
    return;
  },
  async applyPostProcessors(
    resources: object[],
    listPostProcessors: Function[],
    div: HTMLElement,
    context: string,
  ): Promise<void> {
    console.log('Applying other post processors', resources);
    //TODO: Reorder by "pertinence" ??

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(resources, listPostProcessors, div, context);
  },
  async filterCallback(
    resources: object[],
    listPostProcessors: PostProcessorRegistry,
    div: HTMLElement,
    context: string,
  ): Promise<void> {
    if (this.filteredBy || this.searchFields) {
      if (!this.searchCount.has(context)) this.searchCount.set(context, 1);
      if (!this.searchForm) await this.createFilter(context);
      const filteredResources = await searchInResources(
        resources,
        this.filters,
        this.fields,
        this.searchForm,
      );
      resources = resources.filter((_v, index) => filteredResources[index]);
      this.localResources = [...resources];
    }
    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(
        resources,
        listPostProcessors,
        div,
        context + (this.searchCount.get(context) || ''),
      );
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

      if (typeof nextArrayOfObjects !== 'object') {
        console.warn(
          `The format value of ${field} is not suitable with auto-range-[field] attribute`,
        );
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
      this.searchForm = document.getElementById(filteredBy);
      if (!this.searchForm) throw `#${filteredBy} is not in DOM`;
    } else {
      this.searchForm = document.createElement('solid-form-search');
    }
    this.searchForm.component.attach(this);
    this.searchForm.addEventListener('formChange', () => {
      this.filterList(context);
    });
    this.searchForm.toggleAttribute('naked', true);

    if (filteredBy) return;

    //pass attributes to search form
    const searchAttributes = Array.from((this.element as Element).attributes)
      .filter(attr => attr.name.startsWith('search-'))
      .map(attr => ({
        name: attr.name.replace('search-', ''),
        value: attr.value,
      }));

    for (const { name, value } of searchAttributes) {
      this.searchForm.setAttribute(name, value);
    }

    this.element.insertBefore(this.searchForm, this.element.firstChild);
    await this.searchForm.component.populate();
  },
};

export { FilterMixin };
