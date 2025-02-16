import type { PostProcessorRegistry } from '../libs/PostProcessorRegistry.ts';
import { searchInResources } from '../libs/filter.ts';
import type { SearchQuery } from '../libs/interfaces.ts';
import type { ServerSearchOptions } from '../libs/store/server-search.ts';

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
      type: String, // 'server' | 'client'
      default: 'client',
    },
  },
  created() {
    this.searchCount = new Map();
    this.element.addEventListener('populate', () => {
      if (!window.document.contains(this.element)) return;
      this.searchForm?.component.updateAutoRanges();
    });
  },
  attached(): void {
    const filteredBy = this.filteredBy;
    if (this.isFilteredOnServer() && filteredBy) {
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
    return this.filteredOn === 'server' && !!this.fetchData;
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
      this.resources = [...resources];
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
    const arrayOfDataObjects = this.resource.getContainerPredicate();
    if (!arrayOfDataObjects) return [];
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
        // if no element in 'ldp:contains'/'dcat:dataset, catch object id
        // If it's not a container, store its ID
        arrayOfDataIds.push(nextArrayOfObjects['@id']);
        continue;
      }
      // If it's a container, fetch its children
      const children = this.resource.getContainerPredicate();
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
