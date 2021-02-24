const FormMaxlengthMixin = {
  name: 'form-maxlength-mixin',
  attributes: {
    maxlength: {
      type: Number,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'maxlength');
      }
    },
  },
}

export {
  FormMaxlengthMixin
}