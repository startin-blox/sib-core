import { base_context, store } from '../store.js';

const StoreMixin = {
  name: 'store-mixin',
  use: [],
  attributes: {
    dataSrc: {
      type: String,
      default: '',
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
    resource: {},
  },
  attached() {
    if (this.element.resource) {
      this.resource = this.element.resource; // TODO: not good
      this.populate();
    }
  },
  get context() {
    return { ...base_context, ...JSON.parse(this.extraContext) };
  },
  get resources() {
    if (!this.isContainer() || !this.resource['ldp:contains']) return [];
    if (Array.isArray(this.resource['ldp:contains']))
      return this.resource['ldp:contains'];
    return [this.resource['ldp:contains']];
  },
  isContainer() {
    return '@type' in this.resource && this.resource['@type'] === 'ldp:Container';
  },
  toggleLoaderHidden(toggle: boolean) {
    if (this.loaderId) {
      const loader = document.getElementById(this.loaderId);
      if (loader) loader.toggleAttribute('hidden', toggle);
    }
  },
  /*async getUser() {
    // wait for dom
    await domIsReady();
    const sibAuth = document.querySelector('sib-auth');

    // if sib-auth element is not found, return undefined
    if (!sibAuth) {
      return undefined;
    }

    // if element is defined, wait custom element to be ready
    await customElements.whenDefined('sib-auth');

    return sibAuth.getUser();
  }*/
};

export {
  StoreMixin
}