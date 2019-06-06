import { base_context, store } from '../libs/store/store.js';
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
        store.get(value, this.context).then(async resource => {
          this.empty();
          if (this.nestedField) {
            if (!(this.nestedField in resource))
              throw `Error: the key "${this.nestedField}" does not exist on the resource`
            this.resource = resource[this.nestedField];
          } else {
            this.resource = resource;
          }
          await this.populate();
          this.element.dispatchEvent(new CustomEvent('populate', { detail: { resource: this.resource } }));
          this.toggleLoaderHidden(true);
        });
      },
    },
    extraContext: {
      type: String,
      default: null
    },
    next: {
      type: String,
      default: ''
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
    resource: null,
    resourcesFilters: null
  },
  created(): void {
    this.resourcesFilters = [];
  },
  attached(): void {
    if (this.resource) this.populate();
  },
  get context(): object {
    return { ...base_context, ...this.extra_context };
  },
  get extra_context(): object {
    let extraContextElement = this.extraContext ?
    document.getElementById(this.extraContext) : // take element extra context first
    document.querySelector('[data-default-context]'); // ... or look for a default extra context

    if (extraContextElement) return JSON.parse(extraContextElement.textContent || "{}");
    return {}
  },
  get resources(): object[]{
    let resources: object[];
    if (!this.isContainer() || !this.resource['ldp:contains']) resources = [];
    else if (Array.isArray(this.resource['ldp:contains'])) resources = this.resource['ldp:contains'];
    else resources = [this.resource['ldp:contains']];

    this.resourcesFilters.forEach((filter: Function) => resources = filter(resources));
    return resources;
  },
  get loader(): HTMLElement | null {
    return this.loaderId ? document.getElementById(this.loaderId) : null;
  },
  isContainer(): boolean {
    return this.resource && '@type' in this.resource && this.resource['@type'] === 'ldp:Container';
  },
  toggleLoaderHidden(toggle: boolean): void {
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