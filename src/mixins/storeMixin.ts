import { base_context, store } from '../libs/store/store.js';
import { domIsReady, getArrayFrom } from '../libs/helpers.js';

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
          if (this.nestedField) {
            if (!(this.nestedField in resource))
              throw `Error: the key "${this.nestedField}" does not exist on the resource`
            this.resource = resource[this.nestedField];
          } else {
            this.resource = resource;
          }

          // fetch all sources
          if (this.isContainer()) {
            for (resource of getArrayFrom(this.resource,'ldp:contains')) {
              if (resource['@type'] === "sib:source") this.fetchSource(resource).then(() => this.updateDOM())
            }
          }
          await this.updateDOM();
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
    let resources: object[] = getArrayFrom(this.resource, "ldp:contains");

    this.resourcesFilters.forEach((filter: Function) => resources = filter(resources));
    resources = resources.filter(res => res['@type'] !== 'sib:source'); // remove sources from displayed results
    return resources;
  },
  get permissions(): object[]{
    return getArrayFrom(this.resource, "@permissions");
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
  async fetchSource(resource: object): Promise<object> {
    return store.get(resource['container'], this.context).then((data) => {
      this.resource['ldp:contains'].push(...getArrayFrom(data, 'ldp:contains')); // add new resources to the current container
      return resource;
    })
  },
  async updateDOM(): Promise<void> {
    this.empty();
    await this.populate();
    setTimeout(() => (
      this.element.dispatchEvent(new CustomEvent('populate', { detail: { resource: this.resource } })))
    );
    this.toggleLoaderHidden(true);
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