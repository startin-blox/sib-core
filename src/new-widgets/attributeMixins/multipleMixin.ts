const MultipleMixin = {
  name: 'multiple-mixin',
  attributes: {
    fields: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        if (newValue && newValue !== this.listAttributes['fields']) {
          this.listAttributes['fields'] = newValue;
          this.planRender();
        }
      }
    },
  },
}

export {
  MultipleMixin
}