const FormLengthMixin = {
  name: 'form-length-mixin',
  attributes: {
    maxlength: {
      type: Number,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'maxlength');
      }
    },
    minlength: {
      type: Number,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'minlength');
      }
    },
  },
}

export {
  FormLengthMixin
}