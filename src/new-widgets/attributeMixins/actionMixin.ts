const ActionMixin = {
  name: 'action-mixin',
  attributes: {
    src: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        if (newValue && newValue !== this.listAttributes['src']) {
          this.listAttributes['src'] = newValue;
          this.planRender();
        }
      }
    },
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
  ActionMixin
}