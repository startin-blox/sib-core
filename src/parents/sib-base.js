import { base_context, store } from '../store.js';
import { domIsReady, getArrayFrom } from '../helpers/index.js';

export default class SIBBase extends HTMLElement {
  static get observedAttributes() {
    return ['data-src'];
  }

  get extra_context() {
    return JSON.parse(this.getAttribute("extra-context")) || {};
  }

  get context() {
    return { ...base_context, ...this.extra_context };
  }

  toggleLoaderHidden(toggle) {
    if (this.hasAttribute('loader-id')) {
      const loader = document.getElementById(this.getAttribute('loader-id'));
      if (loader) loader.toggleAttribute('hidden', toggle);
    }
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (attribute !== 'data-src') return;

    this.empty();

    // brings a loader out if the attribute is set
    this.toggleLoaderHidden(false);

    if (!newValue) return;

    // gets the data through the store
    store.get(newValue + this.idSuffix, this.context).then(async resource => {
      this.empty();
      this.resource = resource;
      await this.populate();
      this.dispatchEvent(new CustomEvent('populate', { detail: { resource: resource } }));
      this.toggleLoaderHidden(true);
    });
  }

  populate() {
    //this method should be implemented by descending components to insert content
    throw 'Not Implemented';
  }

  empty() {
    //this method should be implemented by descending components to remove all content
    throw 'Not Implemented';
  }

  connectedCallback() {
    if (this.resource) this.populate();
  }

  get isContainer() {
    if (!this.resource) return true;
    return '@type' in this.resource && this.resource['@type'] === 'ldp:Container';
  }

  get next() {
    return this.getAttribute('next');
  }

  get idSuffix() {
    // attribute added to the id given as data-src
    if (this.hasAttribute('id-suffix'))
      return this.getAttribute('id-suffix') + '/';
    else return '';
  }

  get resources() {
    return getArrayFrom(this.resource, "ldp:contains");
  }

  get permissions() {
    if (!this.resource || !this.resource['@permissions']) return [];
    if (Array.isArray(this.resource['@permissions']))
      return this.resource['@permissions'];
    return [this.resource['@permissions']];
  }

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

    return sibAuth.getUser();
  }
}
