const LinkTextMixin = {
  name: 'link-text-mixin',
  attributes: {
    linkText: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'linkText');
      }
    },
  },
}

export {
  LinkTextMixin
}