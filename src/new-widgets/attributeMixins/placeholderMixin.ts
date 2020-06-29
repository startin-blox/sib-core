const PlaceholderMixin = {
  name: 'placeholder-mixin',
  attributes: {
    placeholder: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        if (newValue && newValue !== this.listAttributes['placeholder']) {
          this.listAttributes['placeholder'] = newValue;
          this.planRender();
        }
      }
    },
    label: {
      type: String,
      default: '',
    }
  },
  attached() {
    this.listAttributes['placeholder'] = this.placeholder || this.label || this.name || '';
  }
}

export {
  PlaceholderMixin
}