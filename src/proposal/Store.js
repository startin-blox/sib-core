export default const Store = {
  static get props() {
    return {
      dataSrc: 'data-src',
      extraContext: 'extra-context',
    };
  }

  get watch() {
    return {
      dataSrc(newValue, oldValue) {
        this.getData();
      },
    };
  }

  attached() {
    this.getData();
  }

  get context() {
    return { ...base_context, ...this.extraContext };
  }

  getData() {
    this.loading = true;
    store.get(newValue + this.idSuffix, this.context).then(async resource => {
      this.data = resource;
      this.loading = false;
    });
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
