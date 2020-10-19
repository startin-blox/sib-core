const FormNumberMixin = {
  name: 'form-number-mixin',
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
  },
  getValueFromElement(element: any) {
    return element.value ? Number(element.value) : '';
  },
  get type () {
    return 'number'
  },
}

export {
  FormNumberMixin
}