import { base_context, store } from '../libs/store/store.js';
import { domIsReady, getArrayFrom } from '../libs/helpers.js';

const StoreMixin = {
  name: 'store-mixin',
  use: [],
  attributes: {
    dataSrc: {
      type: String,
      default: null,
      callback: async function (value: string) {
        this.empty();

        // brings a loader out if the attribute is set
        this.toggleLoaderHidden(false);

        if (!value) return;

        // gets the data through the store
        this.resource = await store.get(value, this.context)
        // TODO : GET LDP CONTAINS
        if (this.nestedField) {
          const nestedResource = await this.resource[this.nestedField];
          if (!nestedResource) throw `Error: the key "${this.nestedField}" does not exist on the resource`
          this.resource = await store.get(nestedResource, this.context);
        }

        // fetch all sources
        // if (await this.isContainer()) {
        //   for (let res of getArrayFrom(this.resource,'ldp:contains')) {
        //     if (res['@type'] === "sib:source") this.fetchSource(res).then(() => this.updateDOM())
        //   }
        // }

        await this.updateDOM();
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
  get resources(): Symbol{
    // TODO : filter resources
    // let resources: object[] = getArrayFrom(this.resource, "ldp:contains");

    // this.resourcesFilters.forEach((filter: Function) => resources = filter(resources));
    // resources = resources.filter(res => res['@type'] !== 'sib:source'); // remove sources from displayed results
    return this.resource['ldp:contains']
  },
  get permissions(): object[]{
    return getArrayFrom(this.resource, "@permissions"); // TODO : fix here
  },
  get loader(): HTMLElement | null {
    return this.loaderId ? document.getElementById(this.loaderId) : null;
  },
  async isContainer(): Promise<boolean> {
    return await this.resource['ldp:contains'] !== undefined;
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