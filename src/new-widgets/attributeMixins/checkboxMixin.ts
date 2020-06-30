const CheckboxMixin = {
  name: 'checkbox-mixin',
  attributes: {
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
  CheckboxMixin
}