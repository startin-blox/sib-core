const MultipleMixin = {
  name: 'multiple-mixin',
  attributes: {
    fields: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'fields');
      }
    },
  },
}

export {
  MultipleMixin
}