import { formatAttributesToServerPaginationOptions } from '../libs/store/server-pagination.ts';
import {
  formatAttributesToServerSearchOptions,
  mergeServerSearchOptions,
} from '../libs/store/server-search.ts';
import { store } from '../libs/store/store.ts';
import { AttributeBinderMixin } from './attributeBinderMixin.ts';
import { ContextMixin } from './contextMixin.ts';
import type { Resource } from './interfaces.ts';
import { ServerPaginationMixin } from './serverPaginationMixin.ts';

const StoreMixin = {
  name: 'store-mixin',
  use: [AttributeBinderMixin, ContextMixin, ServerPaginationMixin],
  attributes: {
    noRender: {
      type: String,
      default: null,
      callback: function (value: boolean) {
        if (value === null) this.fetchData(this.dataSrc);
      },
    },
    dataSrc: {
      type: String,
      default: null,
      callback: async function (value: string) {
        const filteredOnServer =
          this.element.attributes['filtered-on']?.value === 'server';
        const limited = this.element.attributes.limit?.value !== undefined;

        if (this.noRender === null && !filteredOnServer && !limited) {
          await this.fetchData(value);
        } else if (this.noRender === null && !filteredOnServer) {
          this.resourceId = value;
        }
      },
    },
    loaderId: {
      type: String,
      default: '',
    },
    nestedField: {
      type: String,
      default: null,
    },
    arrayField: {
      type: String,
      default: null,
      callback: function (value: boolean) {
        if (value)
          this.predicateName = store.getExpandedPredicate(
            this.arrayField,
            this.context,
          );
      },
    },
    predicateName: {
      type: String,
      default: null,
    },
  },
  initialState: {
    resources: [],
    resourceId: null,
    subscription: null,
  },
  created() {
    if (this.element.closest('[no-render]')) this.noRender = ''; // if embedded in no-render, apply no-render to himself
    this.loadResource();
  },
  detached() {
    if (this.subscription) PubSub.unsubscribe(this.subscription);
  },
  get resource(): Resource | null {
    return this._resource;
  },
  async loadResource(): Promise<Resource | null> {
    const id = this.resourceId;
    const serverPagination = formatAttributesToServerPaginationOptions(
      this.element.attributes,
    );
    const serverSearch = mergeServerSearchOptions(
      formatAttributesToServerSearchOptions(this.element.attributes),
      this.getDynamicServerSearch?.(), // from `filterMixin`
    );

    if (id) {
      // 4) Await the async operation. Only _then_ do we assign into _resource.
      const fetched: Resource | null = await store.get(
        id,
        serverPagination,
        serverSearch,
      );
      this._resource = fetched;
      return this._resource;
    }
    return null;
  },
  get loader(): HTMLElement | null {
    return this.loaderId ? document.getElementById(this.loaderId) : null;
  },
  async fetchData(value: string) {
    this.empty();
    if (this.sub1) PubSub.unsubscribe(this.sub1);
    if (this.sub2) PubSub.unsubscribe(this.sub2);
    if (!value || value === 'undefined') return;

    this.resourceId = value;
    if (this.nestedField) {
      // First step: store.getData
      const resource = await store.getData(value, this.context);
      // Which internally triggers store.fetchData -> Fine
      // Which triggers store.fetchAuthn -> Fine
      // Once done it calls store.cacheGraph
      const nestedResource = resource ? await resource[this.nestedField] : null;
      this.resourceId = nestedResource ? await nestedResource['@id'] : null;

      if (resource && !this.resourceId && !nestedResource) {
        for (const property in await resource) {
          console.log(`${property}: ${await resource[property]}`);
        }
        throw `Error: the key "${this.nestedField}" does not exist on the resource at id "${resource['@id']}"`;
      }
    }

    this.updateNavigateSubscription();

    this.sub1 = PubSub.subscribe(this.resourceId, this.updateDOM.bind(this));

    this.sub2 = PubSub.subscribe(
      this.resourceId,
      this.syncResourceWithCache.bind(this),
    );
    const serverPagination = formatAttributesToServerPaginationOptions(
      this.element.attributes,
    );
    const dynamicServerSearch = this.getDynamicServerSearch?.(); // from `filterMixin`
    const serverSearch = mergeServerSearchOptions(
      formatAttributesToServerSearchOptions(this.element.attributes),
      dynamicServerSearch,
    );
    const forceRefetch = !!dynamicServerSearch;
    await store.getData(
      this.resourceId,
      this.context,
      undefined,
      undefined,
      forceRefetch,
      serverPagination,
      serverSearch,
    );
    this._resource = await store.get(this.resourceId);
    this.updateDOM();
  },

  async syncResourceWithCache(): Promise<void> {
    this._resource = await store.get(this.resourceId); // TODO: temp fix!!
  },
  toggleLoaderHidden(toggle: boolean): void {
    if (this.loader) this.loader.toggleAttribute('hidden', toggle);
  },
  updateNavigateSubscription() {},

  async updateDOM(): Promise<void> {
    this._resource = await store.get(this.resourceId); // TODO: temp fix!!
    this.toggleLoaderHidden(false); // brings a loader out if the attribute is set
    this.empty();
    await this.replaceAttributesData();
    await this.populate();
    setTimeout(() =>
      // Brings the dispatchEvent at the end of the queue
      this.element.dispatchEvent(
        new CustomEvent('populate', {
          detail: { resource: { '@id': this.dataSrc } },
        }),
      ),
    );
    this.toggleLoaderHidden(true);
  },
  empty(): void {},
  update() {
    if (this.noRender === null) this.updateDOM();
  },
};

export { StoreMixin };
