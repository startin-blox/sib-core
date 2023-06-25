import { store } from '../libs/store/store';
import { ServerSearchOptions, formatAttributesToServerSearchOptions, mergeServerSearchOptions } from '../libs/store/server-search';
import { AttributeBinderMixin } from './attributeBinderMixin';
import type { Resource } from './interfaces';
import { ContextMixin } from './contextMixin';
import { ServerPaginationMixin } from './serverPaginationMixin';
import { formatAttributesToServerPaginationOptions } from '../libs/store/server-pagination';

const StoreMixin = {
  name: 'store-mixin',
  use: [AttributeBinderMixin, ContextMixin, ServerPaginationMixin],
  attributes: {
    noRender: {
      type: String,
      default: null,
      callback: function (value: boolean) {
        if (value === null) this.fetchData(this.dataSrc);
      }
    },
    dataSrc: {
      type: String,
      default: null,
      callback: async function (value: string) {
        const filteredOnServer = this.element.attributes['filtered-on']?.value === 'server';
        if (this.noRender === null && !filteredOnServer) await this.fetchData(value);
      },
    },
    loaderId: {
      type: String,
      default: ''
    },
    nestedField: {
      type: String,
      default: null
    },
  },
  initialState: {
    resourceId: null,
    subscription: null,
  },
  created() {
    if (this.element.closest('[no-render]')) this.noRender = ''; // if embedded in no-render, apply no-render to himself
  },
  detached() {
    if (this.subscription) PubSub.unsubscribe(this.subscription);
  },
  get resource(): Resource|null{
    let id = this.resourceId;
    if (this.limit) {
      id = this.resourceId + "#p" + this.limit + "?o" + this.offset;
    }
    return id ? store.get(id) : null;
  },
  get loader(): HTMLElement | null {
    return this.loaderId ? document.getElementById(this.loaderId) : null;
  },
  async fetchData(value: string, dynamicServerSearch?: Partial<ServerSearchOptions>) {
    this.empty();
    if (this.subscription) PubSub.unsubscribe(this.subscription);
    if (!value || value == "undefined") return;

    this.resourceId = value;
    if (this.nestedField) {
      const resource = await store.getData(value, this.context);
      const nestedResource = resource ? await resource[this.nestedField] : null;
      this.resourceId = nestedResource ? nestedResource['@id'] : null;
      if (!this.resourceId) throw `Error: the key "${this.nestedField}" does not exist on the resource`
    }
    this.updateNavigateSubscription();

    this.subscription = PubSub.subscribe(this.resourceId, this.updateDOM.bind(this));
    const serverPagination = formatAttributesToServerPaginationOptions(this.element.attributes);
    const serverSearch = mergeServerSearchOptions(
      formatAttributesToServerSearchOptions(this.element.attributes),
      dynamicServerSearch
    );
    const forceRefetch = !!dynamicServerSearch;
    await store.getData(this.resourceId, this.context, undefined, undefined, forceRefetch, serverPagination, serverSearch);

    this.updateDOM();
  },

  toggleLoaderHidden(toggle: boolean): void {
    if (this.loader) this.loader.toggleAttribute('hidden', toggle);
  },
  updateNavigateSubscription() { },
  async updateDOM(): Promise<void> {
    this.toggleLoaderHidden(false); // brings a loader out if the attribute is set
    this.empty();
    await this.replaceAttributesData();
    await this.populate();
    setTimeout(() => ( // Brings the dispatchEvent at the end of the queue
      this.element.dispatchEvent(new CustomEvent('populate', { detail: { resource: {"@id": this.dataSrc} } })))
    );
    this.toggleLoaderHidden(true);
  },
  empty():void {
  },
  update() {
    if (this.noRender === null) this.updateDOM();
  }
};

export {
  StoreMixin
}