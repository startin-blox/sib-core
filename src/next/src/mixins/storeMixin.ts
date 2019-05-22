import { base_context, store } from '../store/store.js';
import { domIsReady } from '../libs/helpers.js';

const StoreMixin = {
  name: 'store-mixin',
  use: [],
  attributes: {
    dataSrc: {
      type: String,
      default: null,
      callback: function (value: string) {
        this.empty();

        // brings a loader out if the attribute is set
        this.toggleLoaderHidden(false);

        if (!value) return;

        // gets the data through the store
        store.get(value + this.idSuffix, this.context).then(async resource => {
          this.empty();
          this.resource = resource;
          await this.populate();
          this.element.dispatchEvent(new CustomEvent('populate', { detail: { resource: resource } }));
          this.toggleLoaderHidden(true);
        });
      },
    },
    idSuffix: {
      type: String,
      default: ''
    },
    extraContext: {
      type: String,
      default: '{}'
    },
    next: {
      type: String,
      default: ''
    },
    loaderId: {
      type: String,
      default: ''
    },
  },
  initialState: {
    resource: null,
    resourcesFilters: null
  },
  created() {
    this.resourcesFilters = [];
  },
  attached() {
    if (this.resource) this.populate();
  },
  get context() {
    return { ...base_context, ...JSON.parse(this.extraContext) };
  },
  get resources() {
    let resources;
    if (!this.isContainer() || !this.resource['ldp:contains']) resources = [];
    else if (Array.isArray(this.resource['ldp:contains'])) resources = this.resource['ldp:contains'];
    else resources = [this.resource['ldp:contains']];

    this.resourcesFilters.forEach(filter => resources = filter(resources));
    return resources;
  },
  get loader() {
    return this.loaderId ? document.getElementById(this.loaderId) : null;
  },
  isContainer() {
    return this.resource && '@type' in this.resource && this.resource['@type'] === 'ldp:Container';
  },
  toggleLoaderHidden(toggle: boolean) {
    if (this.loader) this.loader.toggleAttribute('hidden', toggle);
  },
  async getUser() {
    // wait for dom
    await domIsReady();
    const sibAuth = document.querySelector('sib-auth');

    // if sib-auth element is not found, return undefined
    if (!sibAuth) {
      return undefined;
    }

    // if element is defined, wait custom element to be ready
    await customElements.whenDefined('sib-auth');

    //@ts-ignore
    return sibAuth.getUser(); // TODO : improve this
  }
};

export {
  StoreMixin
}