import { base_context, store } from '../libs/store/store';
import type { Resource } from './interfaces';

const AttributeBinderMixin = {
  name: 'attribute-binder-mixin',
  use: [],
  initialState: {
    bindedAttributes: null
  },
  created() {
    this.bindedAttributes = {};
  },
  /**
   * Reset attributes values
   */
  resetAttributesData() {
    for (let attr of Object.keys(this.bindedAttributes)) {
      this.element.setAttribute(attr, this.bindedAttributes[attr]);
    }
  },
  /**
   * Replace store://XXX attributes by corresponding data
   * @param reset - set to false if no need to reset data
   */
  async replaceAttributesData(reset = true) {
    if (reset) this.resetAttributesData();

    const oldAttributes: any = Array.from(this.element.attributes) // transform NamedNodeMap in object
      .reduce((obj: any, attr: any) => {
        
        // Keep only attributes starting with `store://...`
        if (!attr.value.match(/^store:\/\/(resource|container|user)/)) return { ...obj }

        // Save attr for reset later
        if (!this.bindedAttributes[attr.name]) this.bindedAttributes[attr.name] = attr.value;

        return {
          ...obj,
          [attr.name]: attr.value, // add "key: value"
        };
      }, {});

    const newAttributes = await this.transformAttributes({ ...oldAttributes }, this.resource); // generate new attributes

    for (let attr of Object.keys(newAttributes)) { // set attributes on element
      if (oldAttributes[attr] == newAttributes[attr]) continue; // only if it changed
      this.element.setAttribute(attr, newAttributes[attr]);
    }
  },

  /**
   * Transform attributes from `store://...` to their actual value
   * @param attributes - object representing attributes of an element
   * @param resource - resource to use to resolve attributes
   * @returns - object representing attributes of an element with resolved values
   */
  async transformAttributes(attributes: object, resource: Resource) {
    const isContainer = resource && resource.isContainer?.();

    for (let attr of Object.keys(attributes)) {
      const value = attributes[attr];
      // Avoid error if value is a number
      if (typeof value === 'string') {
        // Replace attribute value
        if (!isContainer && resource && value.startsWith('store://resource')) { // RESOURCE
          let path = value.replace('store://resource.', '');
          attributes[attr] = resource ? await resource[path] : '';
        } else if (isContainer && resource && value.startsWith('store://container')) { // CONTAINER
          let path = value.replace('store://container.', '');
          attributes[attr] = resource ? await resource[path] : '';
        } else if (value.startsWith('store://user')) { // USER
          // retry until sibAuth is defined
          const userId = await this.retry(this.getUser.bind(this));
          // TODO: Using this.context makes no sense here. Use same-attribute-context="context-id" instead?
          const user = userId && userId['@id'] ? await store.getData(userId['@id'], this.context || base_context) : null;
          if (!user) {
            attributes[attr] = '';
            continue;
          }
          let path = value.replace('store://user.', '');
          attributes[attr] = user ? await user[path] : '';
        }
      }
    }
    return attributes;
  },

  /**
   * Returns logged in user from sib-auth
   * @returns userId
   */
  async getUser() {
    const sibAuth: any = document.querySelector('sib-auth');
    return sibAuth.getUser();
  },

  /**
   * Retry [fn] for [maxRetries] times every [ms]
   * @param fn
   * @param ms
   * @param maxRetries
   * @returns
   */
  async retry(fn: Function, ms = 200, maxRetries = 5) {
    return new Promise((resolve, reject) => {
      let retries = 0;
      fn().then(resolve).catch(() => {
        setTimeout(() => {
          ++retries;
          if (retries == maxRetries) return reject();
          this.retry(fn, ms).then(resolve);
        }, ms);
      });
    });
  }
}

export {
  AttributeBinderMixin
}