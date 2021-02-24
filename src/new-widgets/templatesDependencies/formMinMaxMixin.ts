const FormMinMaxMixin = {
  name: 'form-min-max-mixin',
  attributes : {
    min : {
      type: Number,
      callback: function (newValue: number) {
        this.addToAttributes(newValue, 'min');
      }
    },
    max : {
      type: Number,
      callback: function (newValue: number) {
        this.addToAttributes(newValue, 'max');
      }
    },
  }
}

export {
  FormMinMaxMixin
}