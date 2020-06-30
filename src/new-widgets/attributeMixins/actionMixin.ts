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
    label: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'label');
      }
    },
  },
}

export {
  ActionMixin
}