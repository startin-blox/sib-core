import { base_context, store } from '../store.js';

export default class SIBBase extends HTMLElement {
  static get observedAttributes() {
    return ['data-src'];
  }

  get extra_context() {
    return {};
  }

  get context() {
    return { ...base_context, ...this.extra_context };
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
    store.get(newValue + this.idSuffix, this.context).then(resource => {
      this.empty();
      this.resource = resource;
      this.populate();
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
    return 'ldp:contains' in this.resource;
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
    if (!this.isContainer) return [];
    if (Array.isArray(this.resource['ldp:contains']))
      return this.resource['ldp:contains'];
    return [this.resource['ldp:contains']];
  }
}
