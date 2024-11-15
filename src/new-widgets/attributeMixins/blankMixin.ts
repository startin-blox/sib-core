const BlankMixin = {
  name: 'blank-mixin',
  created() {
    this.listAttributes['target'] = '_blank';
  },
};

export { BlankMixin };
