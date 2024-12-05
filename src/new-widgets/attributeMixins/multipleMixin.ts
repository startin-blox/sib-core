const MultipleMixin = {
  name: 'multiple-mixin',
  attributes: {
    fields: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'fields');
      },
    },
    next: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'next');
      },
    },
    emptyWidget: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'emptyWidget');
      },
    },
  },
};

export { MultipleMixin };
