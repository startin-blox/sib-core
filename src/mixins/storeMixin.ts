import { base_context, store } from '../libs/store/store.js';

const StoreMixin = {
  name: 'store-mixin',
  use: [],
  attributes: {
    dataSrc: {
      type: String,
      default: null,
      callback: async function (value: string) {
        this.empty();
        if (!value) return;

        this.resourceId = value;
        await store.initGraph(this.resourceId, this.context);

        // Init graph for nested fields
        if (this.nestedField) {
          this.resourceId = (await this.resource[this.nestedField]).toString()
          if (!this.resourceId) throw `Error: the key "${this.nestedField}" does not exist on the resource`
          await store.initGraph(this.resourceId, this.context);
        }

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
    resourceId: null
  },
  /* attached(): void {
    if (this.resource) this.populate(); // TODO : if we want to be stateless, we must remove this
  },*/
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
  get resource(): object{
    return this.resourceId ? store.get(this.resourceId) : {};
  },
  get loader(): HTMLElement | null {
    return this.loaderId ? document.getElementById(this.loaderId) : null;
  },
  toggleLoaderHidden(toggle: boolean): void {
    if (this.loader) this.loader.toggleAttribute('hidden', toggle);
  },
  async updateDOM(): Promise<void> {
    this.toggleLoaderHidden(false); // brings a loader out if the attribute is set
    this.empty();
    await this.populate();
    setTimeout(() => ( // Brings the dispatchEvent at the end of the queue
      this.element.dispatchEvent(new CustomEvent('populate', { detail: { resource: {"@id": this.dataSrc} } })))
    );
    this.toggleLoaderHidden(true);
  },
  /*
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
  */
};

export {
  StoreMixin
}