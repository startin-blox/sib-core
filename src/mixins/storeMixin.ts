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
        if (!value || value == "undefined") return;

        this.resourceId = value;
        await store.initGraph(this.resourceId, this.context);

        // Init graph for nested fields
        if (this.nestedField) {
          this.resourceId = (await this.resource[this.nestedField])['@id']
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
  get resource(): object|null{
    return this.resourceId ? store.get(this.resourceId) : null;
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
  }
};

export {
  StoreMixin
}