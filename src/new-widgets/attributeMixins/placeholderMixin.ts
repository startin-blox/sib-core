const PlaceholderMixin = {
  name: 'placeholder-mixin',
  attributes: {
    placeholder: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'placeholder');
      },
    },
  },
  attached() {
    this.listAttributes['placeholder'] =
      this.placeholder || this.label || this.name || '';
  },
};

export { PlaceholderMixin };
