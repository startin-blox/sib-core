const BlankMixin = {
  name: 'blank-mixin',
  attached() {
    this.listAttributes['target'] = '_blank';
  }
}

export {
  BlankMixin
}