const TelMixin = {
  name: 'tel-mixin',
  created() {
    this.listAttributes['tel'] = 'tel:';
  }
}

export {
  TelMixin
}