import { baseContext, store } from '../store.js';
import { domIsReady } from '../helpers/index.js';

export default class SIBBase extends HTMLElement {
  static get observedAttributes() {
    return ['data-src'];
  }

  get extra_context() {
    return JSON.parse(this.getAttribute("extra-context")) || {};
  }

  get context() {
    return { ...baseContext, ...this.extraContext };
  }

  toggleLoaderHidden(toggle) {
    if (this.hasAttribute('loader-id')) {
      document
        .getElementById(this.getAttribute('loaderId'))
        .toggleAttribute('hidden', toggle);
    }
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (attribute !== 'data-src') return;

    this.empty();

    // brings a loader out if the attribute is set
    this.toggleLoaderHidden(false);

    if (!newValue) return;

    // gets the data through the store
    store.get(newValue + this.idSuffix, this.context).then(async (resource) => {
      this.empty();
      this.resource = resource;
      await this.populate();
      this.dispatchEvent(new CustomEvent('populate', { detail: { resource } }));
      this.toggleLoaderHidden(true);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  populate() {
    // this method should be implemented by descending components to insert content
    throw new Error('Not Implemented');
  }

  // eslint-disable-next-line class-methods-use-this
  empty() {
    // this method should be implemented by descending components to remove all content
    throw new Error('Not Implemented');
  }

  connectedCallback() {
    if (this.resource) this.populate();
  }

  get isContainer() {
    return this.resource['@type'] === 'ldp:Container';
  }

  get next() {
    return this.getAttribute('next');
  }

  get idSuffix() {
    // attribute added to the id given as data-src
    if (this.hasAttribute('id-suffix')) return `${this.getAttribute('id-suffix')}/`;
    return '';
  }

  get resources() {
    if (!this.isContainer) return [];
    if (Array.isArray(this.resource['ldp:contains'])) return this.resource['ldp:contains'];
    return [this.resource['ldp:contains']];
  }

  // eslint-disable-next-line class-methods-use-this
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
