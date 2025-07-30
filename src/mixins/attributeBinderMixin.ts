import { base_context } from '../libs/store/implemenations/ldp/LdpStore.ts';
import type { Resource } from './interfaces.ts';

import { StoreService } from '../libs/store/storeService.ts';
const store = StoreService.getInstance();
// const store = await getStoreAsync();
if (!store) throw new Error('Store is not available');

const AttributeBinderMixin = {
  name: 'attribute-binder-mixin',
  use: [],
  initialState: {
    bindedAttributes: null,
  },
  created() {
    this.bindedAttributes = {};
  },
  /**
   * Reset attributes values
   */
  resetAttributesData() {
    for (const attr of Object.keys(this.bindedAttributes)) {
      this.element.setAttribute(attr, this.bindedAttributes[attr]);
    }
  },
  /**
   * Replace store://XXX attributes by corresponding data
   * @param reset - set to false if no need to reset data
   */
  async replaceAttributesData(reset = true) {
    if (reset) this.resetAttributesData();

    const oldAttributes: Record<string, string> = {};
    for (const attr of (this.element as Element).attributes) {
      if (!attr.value.match(/^store:\/\/(resource|container|user)/)) continue;

      if (!this.bindedAttributes[attr.name])
        this.bindedAttributes[attr.name] = attr.value;

      oldAttributes[attr.name] = attr.value;
    }

    const newAttributes = await this.transformAttributes(
      { ...oldAttributes },
      this.resource,
    ); // generate new attributes

    for (const attr of Object.keys(newAttributes)) {
      // set attributes on element
      if (oldAttributes[attr] === newAttributes[attr]) continue; // only if it changed
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
    const isContainer = resource?.isContainer?.();

    for (const attr of Object.keys(attributes)) {
      const value = attributes[attr];
      // Avoid error if value is a number
      if (typeof value === 'string') {
        // Replace attribute value
        if (!isContainer && resource && value.startsWith('store://resource')) {
          // RESOURCE
          const path = value.replace('store://resource.', '');
          attributes[attr] = resource ? await resource[path] : '';
        } else if (
          isContainer &&
          resource &&
          value.startsWith('store://container')
        ) {
          // CONTAINER
          const path = value.replace('store://container.', '');
          attributes[attr] = resource ? await resource[path] : '';
        } else if (value.startsWith('store://user')) {
          // USER
          // retry until sibAuth is defined
          const userId = await this.retry(this.getUser.bind(this));
          // TODO: Using this.context makes no sense here. Use same-attribute-context="context-id" instead?
          const user = userId?.['@id']
            ? await store.getData(userId['@id'], this.context || base_context)
            : null;
          if (!user) {
            attributes[attr] = '';
            continue;
          }
          const path = value.replace('store://user.', '');
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
    return await sibAuth.getUser();
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
      fn()
        .then(resolve)
        .catch(() => {
          setTimeout(() => {
            ++retries;
            if (retries >= maxRetries) return reject();
            this.retry(fn, ms).then(resolve);
          }, ms);
        });
    });
  },
};

export { AttributeBinderMixin };
