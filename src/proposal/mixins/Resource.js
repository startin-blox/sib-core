export default class {
  static get attrs() {
    return ['sib-resource-uri'];
  }

  created() {
    console.log('Yep');
    this._resource = null;
    this.addEventListener('dataChanged:sibResourceUri', (event) => {
      console.log('dataChanged:sibResourceUri');
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
