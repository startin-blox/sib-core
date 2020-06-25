const CheckboxMixin = {
  name: 'checkbox-mixin',
  attributes: {
    label: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        if (newValue && newValue !== this.listAttributes['label']) {
          this.listAttributes['label'] = newValue;
          this.planRender();
        }
      }
    },
  },
}

export {
  CheckboxMixin
}