import { base_context, store } from '../libs/store/store';

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
   */
  async getAttributesData(reset = true) {
    if (reset) this.resetAttributesData();
    const isContainer = this.resource && this.resource.isContainer();

    for (let attr of this.element.attributes) {
      if (!attr.value.startsWith('store://')) continue;

      // Save attr for reset later
      if (!this.bindedAttributes[attr.name]) this.bindedAttributes[attr.name] = attr.value;

      // Replace attribute value
      if (!isContainer && this.resource && attr.value.startsWith('store://resource')) { // RESOURCE
        let path = attr.value.replace('store://resource.', '');
        attr.value = this.resource ? await this.resource[path] : '';
      } else if (isContainer && this.resource && attr.value.startsWith('store://container')) { // CONTAINER
        let path = attr.value.replace('store://container.', '');
        attr.value = this.resource ? await this.resource[path] : '';
      } else if (attr.value.startsWith('store://user')) { // USER
        const userId = await this.retry(this.getUser.bind(this)); // retry until sibAuth is defined
        const user = userId && userId['@id'] ? await store.getData(userId['@id'], this.context || base_context) : null;
        if (!user) {
          attr.value = '';
          continue;
        }
        let path = attr.value.replace('store://user.', '');
        attr.value = user ? await user[path] : '';
      }
    }
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