import type { PostProcessorRegistry } from '../libs/PostProcessorRegistry.ts';
// import { SparqlQueryEngineComunica } from '../libs/SparqlQueryEngineComunica.ts';
import { searchInResources } from '../libs/filter.ts';
import type { SearchQuery } from '../libs/interfaces.ts';
import type { ServerSearchOptions } from '../libs/store/server-search.ts';
import { base_context, store } from '../libs/store/store.ts';
// import IndexLoader from '../libs/store/index-loader.ts';
import '../libs/store/semantizer.ts';

// Semantizer imports
// import semantizer from '@semantizer/default';
// import indexFactory, { indexShapeFactory } from '@semantizer/mixin-index';
import { EntryStreamTransformerDefaultImpl, indexFactory } from "@semantizer/mixin-index";
// import { indexEntryFactory } from '@semantizer/mixin-index/lib/IndexEntryMixin.js';
import { IndexQueryingStrategyShaclDefaultImpl } from "@semantizer/utils-index-querying-strategy-shacl";
import { IndexStrategyFinalShapeDefaultImpl } from "@semantizer/utils-index-querying-strategy-shacl-final";
import { solidWebIdProfileFactory } from '@semantizer/mixin-solid-webid';
import type { DatasetSemantizer, NamedNode } from '@semantizer/types';

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
        console.log('Set instance profile src', value);
      },
    },
    dataSrcIndex: {
      type: String,
      default: null,
      callback(value: string) {
        this.filteredOn = FilterMode.Index;
        console.log('Set index src', value);
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
      console.log('Filter values', filterValues);
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
    sibStore.setLocalData(this.localResources, this.dataSrc, true);
    if (this.loader) {
      this.loader.toggleAttribute('hidden', false);
    }

    const filterValues = submitEvent.target.parentElement.component.value;
    console.log('Filter values', filterValues);
    this.triggerIndexSearch(filterValues);
  },
  async triggerIndexSearch(filterValues: []) {
    console.log('Trigger index-based search', filterValues);
    console.log('This', this.filters, this.searchFields);
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
      console.log('Load index directly', this.dataSrcIndex);
      indexDataset = await SEMANTIZER.load(
        this.dataSrcIndex
      );
      console.log('Index dataset', indexDataset);
    }

    // This line can be combined by passing indexFactory in the load instruction
    // 4. Build the index mixin
    // console.log('Index dataset', indexDataset);
    // const index = SEMANTIZER.build(indexFactory, indexDataset);

    // 5. Construct the shape by iterating over fields from the component and resolving their predicate names
    // and get the associated filter values for each of them and add them as pattern
    // How to differentiate between pattern and value properties?
    // const shape = SEMANTIZER.build(indexShapeFactory);
    // const dataFactory = SEMANTIZER.getConfiguration().getRdfDataModelFactory();

    // // How can we know the type of the shape from the component configuration ?
    // // Or should actually the shape be a static configuration object for the component itself ?
    // // We could look at a new attribute data-rdf-type on the component to know the type of the shape
    // // this.element.component.dataRdfType = "https://cdn.startinblox.com/owl#User";
    // console.log('Data RDF type', this.dataRdfType);
    // const dataRdfTypeNode = dataFactory.namedNode(this.dataRdfType);
    // console.log('Data RDF type node', dataRdfTypeNode);
    // shape.addTargetRdfType(dataRdfTypeNode);

    // // How to get the proper predicates from the fields attribute of the component ?
    // // We need to parse the fields attribute to get the predicates
    // // const fields = this.searchFields;
    // // const filterValues = parseFieldsString(fields);

    // // But, there are limitations with this parseFieldsString function:
    // // - There are fields which have multiple values, like skills, which values are an array of resources (with @ids)
    // // - Deal with that later !!

    // // - There are fields which are sets, which means a combination of two actual predicates, like name(firstName, lastName)
    // // - Deal with that later !!

    // // - There are fields which are predicates from a linked object, like profile.city on the user, which is a reference to a "city" literal value
    // console.log('Fields after parsing', filterValues);
    // for (const [field, fieldValue] of Object.entries(filterValues)) {
    //   const value = fieldValue as FilterValue;
    //   console.log(
    //     'Field, fieldValue, fieldValue!.value',
    //     field,
    //     fieldValue,
    //     value.value,
    //   );

    //   let path = field;
    //   if (field.includes('.')) {
    //     // Split the path on each dots
    //     const fieldPath: string[] = field.split('.');

    //     // Get last path
    //     path = fieldPath.pop() as string;
    //   }

    //   // Arbitrarily format the field name to match the predicate name
    //   // we need to convert the _*char* to *Char* to match the predicate name
    //   const fieldName = path.replace(/_([a-z])/g, g => g[1].toUpperCase());
    //   console.log('Field name', fieldName);
    //   const actualPredicate = store.getExpandedPredicate(
    //     fieldName,
    //     base_context,
    //   );

    //   // actualPredicate = actualPredicate.replace('https', 'http');
    //   console.log('Actual predicate', actualPredicate);
    //   // Check that value is not empty and that it is not an empty array
    //   if (
    //     Array.isArray(value.value) &&
    //     (value.value as Array<string>).length > 0
    //   ) {
    //     // We need to handle the case where the field is an array of resources
    //     // We need to add a pattern property for each of the resources in the array
    //     for (const unitValue of value.value as Array<string>) {
    //       shape.addPatternProperty(
    //         dataFactory.namedNode(actualPredicate),
    //         dataFactory.namedNode(unitValue),
    //       );
    //       console.log('Adding pattern property',
    //         dataFactory.namedNode(actualPredicate),
    //         dataFactory.namedNode(unitValue),
    //         'to shape',
    //         shape
    //       );
    //     }
    //   } else if (typeof value.value === 'string' && value.value.length > 0) {
    //     // @ts-ignore
    //     shape.addPatternProperty(
    //       dataFactory.namedNode(actualPredicate),
    //       dataFactory.literal(`${value.value}.*`),
    //     );
    //     console.log('Adding pattern property',
    //       dataFactory.namedNode(actualPredicate),
    //       dataFactory.namedNode(`${value.value}.*`),
    //       'to shape',
    //       shape
    //     );
    //   }
    // }

    // // How to know what filters are present in the shape ?
    // console.log('Log right before getFilterProperties call');
    // console.log('Shape filter properties', shape.getFilterProperties());
    // console.log('Log right after getFilterProperties call');

    // // if shape does not contains any pattern property, we add a default one
    // if (shape.getFilterProperties().length === 0) {
    //   shape.addPatternProperty(
    //     dataFactory.namedNode('https://cdn.startinblox.com/owl/tems.jsonld#description'),
    //     dataFactory.literal('lor.*'),
    //   );
    //   console.log('Adding default pattern property for description',
    //     dataFactory.namedNode('https://cdn.startinblox.com/owl/tems.jsonld#description'),
    //     dataFactory.literal('lor.*'),
    //     'to shape',
    //     shape
    //   );
    // }

    // console.log('Shape filter properties', shape.getFilterProperties());
    // console.log('Shape after iterating on the fields', shape);
    const finalShapeTemplate = await fetch(this.dataFinalShape);
    let finalShapeTurtle = await finalShapeTemplate.text();

    const subindexShapeTemplate = await fetch(this.dataSubindexShape);
    let subIndexShapeTurtle = await subindexShapeTemplate.text();

    const targetShapeTemplate = await fetch(this.dataTargetShape);
    let targetShapeTurtle = await targetShapeTemplate.text();
    // console.log('Target shape', targetShapeTurtle);
    // console.log('Final shape', finalShapeTurtle);
    // console.log('Sub index shape', subIndexShapeTurtle);

    // const filterValues = parseFieldsString(fields);
    const filterFields = Object.entries(filterValues);
    console.log('Filter fields', filterFields);
    const firstField = filterFields[0];
    const firstFieldValue = firstField[1] as FilterValue;
    console.log('First field', firstField);
    console.log('First field value', firstFieldValue);
    console.log('First field value', firstFieldValue.value);

    let path = firstField[0];
    if (path.includes('.')) {
      // Split the path on each dots
      const fieldPath: string[] = path.split('.');
      // Get last path
      path = fieldPath.pop() as string;
    }

    const fieldName = path.replace(/_([a-z])/g, g => g[1].toUpperCase());
    console.log('Field name', fieldName);

    // Replace the placeholder in the subindex shape
    subIndexShapeTurtle = subIndexShapeTurtle.replace(
      '__PLACEHOLDER_RDFTYPE__',
      this.dataRdfType,
    );
    subIndexShapeTurtle = subIndexShapeTurtle.replace(
      '__PLACEHOLDER_PROPERTYNAME__',
      fieldName,
    );
    console.log('Sub index shape with rdf type and property name', subIndexShapeTurtle);

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
    console.log('Final shape with rdf type and property name and pattern', finalShapeTurtle);

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

    console.log('Target shape with rdf type, property name and pattern', targetShapeTurtle);
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
    const shaclStrategy = new IndexQueryingStrategyShaclDefaultImpl(targetShape, finalIndexStrategy, shaclValidator, entryTransformer);

    const index = await SEMANTIZER.load(
      this.dataSrcIndex,
      indexFactory
    );

    const resultStream = index.query(shaclStrategy);
    // console.log('Strategy', resultStream);
    resultStream.on('data', (result: NamedNode) => {
      console.log('Result stream', result);
      this.updateContainer(result)
      console.log('Result', result);
    });

    // await index.findTargetsRecursively(
    //   strategy,
    //   (...args) => this.updateContainer(...args),
    //   9,
    // );
  },
  updateContainer(resource: NamedNode) {
    console.log('Update container', resource.value, this.localResources);
    if (resource.value) {
      this.localResources['ldp:contains'].push({
        '@id': resource.value || '',
        '@type': this.dataRdfType,
      });
    }

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
    // console.log('Init local data source container for search results', idField);
    this.dataSrc = `store://local.${idField}/`;
    this.localResources = {
      '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
      '@type': 'ldp:Container',
      '@id': this.dataSrc,
      'ldp:contains': new Array<any>(),
      permissions: ['view'],
    };
    // console.log('Resources right after initialization', this.localResources);
    await sibStore.setLocalData(this.localResources, this.dataSrc);
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
