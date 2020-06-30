const PlaceholderMixin = {
  name: 'placeholder-mixin',
  attributes: {
    placeholder: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'placeholder');
      }
    },
    label: {
      type: String,
      default: '',
    }
  },
  attached() {
    this.listAttributes['placeholder'] = this.placeholder || this.label || this.name || '';
    console.log(this.listAttributes['placeholder']);
  }
}

export {
  PlaceholderMixin
}