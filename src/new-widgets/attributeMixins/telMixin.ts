const TelMixin = {
  name: 'tel-mixin',
  attached() {
    this.listAttributes['tel'] = 'tel:';
  }
}

export {
  TelMixin
}