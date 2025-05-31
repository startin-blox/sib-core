import type { PostProcessorRegistry } from '../libs/PostProcessorRegistry.ts';
// import { SparqlQueryEngineComunica } from '../libs/SparqlQueryEngineComunica.ts';
import { searchInResources } from '../libs/filter.ts';
import type { SearchQuery } from '../libs/interfaces.ts';
import type { ServerSearchOptions } from '../libs/store/server-search.ts';
import { store } from '../libs/store/store.ts';
// import IndexLoader from '../libs/store/index-loader.ts';
import '../libs/store/semantizer.ts';

// Semantizer imports
// import semantizer from '@semantizer/default';
// import indexFactory, { indexShapeFactory } from '@semantizer/mixin-index';
import { EntryStreamTransformerDefaultImpl, indexFactory } from "@semantizer/mixin-index";
// import { indexEntryFactory } from '@semantizer/mixin-index/lib/IndexEntryMixin.js';
import { IndexStrategyFinalShapeDefaultImpl, IndexQueryingStrategyShaclUsingFinalIndex } from "@semantizer/utils-index-querying-strategy-shacl-final";
import { solidWebIdProfileFactory } from '@semantizer/mixin-solid-webid';
import type { DatasetSemantizer, LoggingEntry, NamedNode } from '@semantizer/types';

import N3 from "n3";
// import dataFactory from "@rdfjs/data-model";
import { ValidatorImpl } from "@semantizer/utils-shacl-validator-default";


// The index strategies: two choices, use a default algorithm by Maxime or use a SPARQL query with Comunica
// import IndexStrategyConjunction from '@semantizer/mixin-index-strategy-conjunction';
// import { DatasetBaseFactoryImpl } from '@semantizer/core';
// import IndexStrategySparqlComunica from "@semantizer/mixin-index-strategy-sparql-comunica";

enum FilterMode {
  Server = 'server',
  Client = 'client',
  Index = 'index',
}

enum IndexType {
  Index = 'https://ns.inria.fr/idx/terms#Index',
}

interface FilterValue {
  value: string | string[];
}

SEMANTIZER.enableLogging();
SEMANTIZER.registerEntryCallback((logEntry: LoggingEntry) => console.log(logEntry.level, logEntry.message));

const FilterMixin = {
  name: 'filter-mixin',
  use: [],
  initialState: {
    searchCount: null,
  },
  attributes: {
    dataRdfType: {
      type: String,
      default: null,
    },
    dataSrcProfile: {
      type: String,
      default: null,
      callback(value: string) {
        this.filteredOn = FilterMode.Index;
      },
    },
    dataSrcIndex: {
      type: String,
      default: null,
      callback(value: string) {
        this.filteredOn = FilterMode.Index;
      },
    },
    dataTargetShape: {
      type: String,
      default: null,
    },
    dataFinalShape: {
      type: String,
      default: null,
    },
    dataSubindexShape: {
      type: String,
      default: null,
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
    searchFields: {
      type: String,
      default: null,
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

    if (this.isFilteredByIndex() && filteredBy) {
      this.searchForm = document.getElementById(filteredBy);
      if (!filteredBy) throw '#Missing filtered-by attribute';

      // Create the local container to store search results
      await this.initLocalDataSourceContainerForSearchResults();
      console.log(
        'Init index based search',
        this.dataSrcIndex,
        this.dataSrcProfile
      );

      const filterValues = this.searchForm.component.value;
      this.triggerIndexSearch(filterValues);

      this.searchForm.addEventListener('submit', this.onIndexSearch.bind(this));
      this.listPostProcessors.attach(this.applyPostProcessors.bind(this));
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
    store.setLocalData(this.localResources, this.dataSrc, true);
    if (this.loader) {
      this.loader.toggleAttribute('hidden', false);
    }

    const filterValues = submitEvent.target.parentElement.component.value;
    this.triggerIndexSearch(filterValues);
  },
  async triggerIndexSearch(filterValues: []) {
    let indexDataset: DatasetSemantizer | undefined;

    // 0. Load the instance profile if defined
    if (this.dataSrcProfile) {
      console.log('Load application profile', this.dataSrcProfile);
      // // 1. Load the WebId of the instance
      const appIdProfile = await SEMANTIZER.load(
        this.dataSrcProfile,
        solidWebIdProfileFactory
      );

      // await appIdProfile.loadExtendedProfile();
      const appId = appIdProfile.getPrimaryTopic();
      if (!appId) {
        throw new Error('The WebId was not found.');
      }

      // 2. Get the public type index
      const publicTypeIndex = appId.getPublicTypeIndex();
      if (!publicTypeIndex) {
        throw new Error('The TypeIndex was not found.');
      }

      await publicTypeIndex.load();

      // 3. Find the index from the TypeIndex
      indexDataset = publicTypeIndex.getRegisteredInstanceForClass(
        IndexType.Index,
      ) as DatasetSemantizer;

      if (!indexDataset) {
        throw new Error('The meta-meta index was not found.');
      }
    } else if (this.dataSrcIndex) {
      // 1. Load the index directly
      indexDataset = await SEMANTIZER.load(
        this.dataSrcIndex
      );
    }

    const finalShapeTemplate = await fetch(this.dataFinalShape);
    let finalShapeTurtle = await finalShapeTemplate.text();

    const subindexShapeTemplate = await fetch(this.dataSubindexShape);
    let subIndexShapeTurtle = await subindexShapeTemplate.text();

    const targetShapeTemplate = await fetch(this.dataTargetShape);
    let targetShapeTurtle = await targetShapeTemplate.text();

    const filterFields = Object.entries(filterValues);
    const firstField = filterFields[0];
    const firstFieldValue = firstField[1] as FilterValue;

    let path = firstField[0];
    if (path.includes('.')) {
      // Split the path on each dots
      const fieldPath: string[] = path.split('.');
      // Get last path
      path = fieldPath.pop() as string;
    }

    const fieldName = path.replace(/_([a-z])/g, g => g[1].toUpperCase());
    // Replace the placeholder in the subindex shape
    subIndexShapeTurtle = subIndexShapeTurtle.replace(
      '__PLACEHOLDER_RDFTYPE__',
      this.dataRdfType,
    );
    subIndexShapeTurtle = subIndexShapeTurtle.replace(
      '__PLACEHOLDER_PROPERTYNAME__',
      fieldName,
    );

    // Replace the placeholder in the final shape
    finalShapeTurtle = finalShapeTurtle.replace(
      '__PLACEHOLDER_RDFTYPE__',
      this.dataRdfType,
    );
    finalShapeTurtle = finalShapeTurtle.replace(
      '__PLACEHOLDER_PROPERTYNAME__',
      fieldName,
    );
    finalShapeTurtle = finalShapeTurtle.replace(
      '__PATTERN_PLACEHOLDER__',
      firstFieldValue.value as string,
    );

    // Replace the placeholder in the target shape
    targetShapeTurtle = targetShapeTurtle.replace(
      '__PLACEHOLDER_RDFTYPE__',
      this.dataRdfType,
    );
    targetShapeTurtle = targetShapeTurtle.replace(
      '__PLACEHOLDER_PROPERTYNAME__',
      fieldName,
    );
    targetShapeTurtle = targetShapeTurtle.replace(
      '__PATTERN_PLACEHOLDER__',
      firstFieldValue.value as string,
    );

    const parser = new N3.Parser({ format: 'text/turtle' });
    const targetShape = SEMANTIZER.build();
    targetShape.addAll(parser.parse(targetShapeTurtle));

    const finalIndexShape = SEMANTIZER.build();
    finalIndexShape.addAll(parser.parse(finalShapeTurtle));

    const subIndexShape = SEMANTIZER.build();
    subIndexShape.addAll(parser.parse(subIndexShapeTurtle));

    const shaclValidator = new ValidatorImpl();
    const entryTransformer = new EntryStreamTransformerDefaultImpl(SEMANTIZER);

    const finalIndexStrategy = new IndexStrategyFinalShapeDefaultImpl(finalIndexShape, subIndexShape, shaclValidator, entryTransformer);
    const shaclStrategy = new IndexQueryingStrategyShaclUsingFinalIndex(targetShape, finalIndexStrategy, shaclValidator, entryTransformer);

    const index = await SEMANTIZER.load(
      this.dataSrcIndex,
      indexFactory
    );

    const resultStream = index.mixins.index.query(shaclStrategy);
    resultStream.on('data', (result: NamedNode) => {
      this.updateContainer(result)
    });
  },
  updateContainer(resource: NamedNode) {
    console.log('Update result container', resource.value, this.localResources);
    if (resource.value) {
      this.localResources['ldp:contains'].push({
        '@id': resource.value || '',
        '@type': this.dataRdfType,
      });
    }

    store.setLocalData(this.localResources, this.dataSrc, true);
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

    this.dataSrc = `store://local.${idField}/`;
    this.localResources = {
      '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
      '@type': 'ldp:Container',
      '@id': this.dataSrc,
      'ldp:contains': new Array<any>(),
      permissions: ['view'],
    };

    await store.setLocalData(this.localResources, this.dataSrc);
    if (this.loader) this.loader.toggleAttribute('hidden', true);
  },
  isFilteredOnServer() {
    return this.filteredOn === FilterMode.Server && !!this.fetchData;
  },
  isFilteredByIndex() {
    return this.filteredOn === FilterMode.Index;
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
    const arrayOfDataObjects = this.resource['listPredicate'];
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
        // If it's not a container, store its ID
        arrayOfDataIds.push(nextArrayOfObjects['@id']);
        continue;
      }
      // If it's a container, fetch its children
      const children = nextArrayOfObjects['listPredicate'];
      if (!children) continue;
      arrayOfDataIds.push(...children.map(child => child['@id']));
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
