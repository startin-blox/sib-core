const ActionMixin = {
  name: 'action-mixin',
  attributes: {
    src: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'src');
      }
    },
  },
}

export {
  ActionMixin
}