import { base_context, store } from '../../store.js';

export default class {
  static get attrs() {
    return ['sib-resource-uri'];
  }

  attached() {
    this._resource = null;

    if (this.sibResourceUri) {
      store.get(this.sibResourceUri, base_context).then(async resource => {
        this.resource = resource;
      });
    }
    this.watch('sibResourceUri', (newValue) => {
      store.get(newValue, base_context).then(async resource => {
        this.resource = resource;
      });
    });
  }

  get resource() {
    return this._resource;
  }

  set resource(resource) {
    const oldResource = { ...this._resource };
    this._resource = resource;

    Reflect.ownKeys(resource).forEach((key) => {
      this.valueChanged(key, resource[key], oldResource[key]);
    })
  }
}
