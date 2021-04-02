import { store } from '../libs/store/store';
import { AttributeBinderMixin } from './attributeBinderMixin';
import type { Resource } from './interfaces';
import { ContextMixin } from './contextMixin';

const StoreMixin = {
  name: 'store-mixin',
  use: [AttributeBinderMixin, ContextMixin],
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
        if (this.noRender === null) await this.fetchData(value);
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
    return this.resourceId ? store.get(this.resourceId) : null;
  },
  get loader(): HTMLElement | null {
    return this.loaderId ? document.getElementById(this.loaderId) : null;
  },
  async fetchData(value: string) {
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
    await store.getData(this.resourceId, this.context);
    this.updateDOM();
  },
  toggleLoaderHidden(toggle: boolean): void {
    if (this.loader) this.loader.toggleAttribute('hidden', toggle);
  },
  updateNavigateSubscription() { },
  async updateDOM(): Promise<void> {
    this.toggleLoaderHidden(false); // brings a loader out if the attribute is set
    this.empty();
    await this.getAttributesData();
    await this.populate();
    setTimeout(() => ( // Brings the dispatchEvent at the end of the queue
      this.element.dispatchEvent(new CustomEvent('populate', { detail: { resource: {"@id": this.dataSrc} } })))
    );
    this.toggleLoaderHidden(true);
  },
  /**
   * Replace store://XXX attributes by corresponding data
   */
  async getAttributesData() {
    this.resetAttributesData();
    const isContainer = this.resource && this.resource.isContainer();

    for (let attr of this.element.attributes) {
      if (!attr.value.startsWith('store://')) continue;

      // Save attr for reset later
      if (!this.bindedAttributes[attr.name]) this.bindedAttributes[attr.name] = attr.value;

      // Replace attribute value
      if (!isContainer && attr.value.startsWith('store://resource')) { // resource
        let path = attr.value.replace('store://resource.', '');
        attr.value = this.resource ? await this.resource[path] : '';
      } else if (isContainer && attr.value.startsWith('store://container')) { // container
        let path = attr.value.replace('store://container.', '');
        console.log(path, this.resource, this.resource[path]);
        attr.value = this.resource ? await this.resource[path] : '';
      } else if (attr.value.startsWith('store://user')) { // user
        const sibAuth = document.querySelector('sib-auth');
        const userId = await (sibAuth as any)?.getUser();
        const user = userId && userId['@id'] ? await store.getData(userId['@id'], this.context) : null;
        if (!user)  {
          attr.value = '';
          continue;
        }
        let path = attr.value.replace('store://user.', '');
        attr.value = user ? await user[path] : '';
      }
    }
  },
  /**
   * Reset attributes values
   */
  resetAttributesData() {
    for (let attr of Object.keys(this.bindedAttributes)) {
      this.element.setAttribute(attr, this.bindedAttributes[attr]);
    }
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