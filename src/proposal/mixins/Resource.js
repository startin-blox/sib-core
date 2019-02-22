export default class {
  static get attrs() {
    return ['sib-resource-uri'];
  }

  created() {
    this._resource = null;
    this.addEventListener('dataChanged:sibResourceUri', (event) => {
      const { detail } = event;
      if ('value' in detail && detail.value) {
        this.store.get(detail.value).then(resource => {
          this.resource = resource;
        });
      }
    });
  }

  get resource() {
    return this._resource;
  }

  set resource(resource) {
    const oldResource = { ...this._resource };
    this._resource = resource;

    Reflect.ownKeys(resource).forEach((key) => {
      this.state.follow(key, resource[key]);
    });
  }
}
