const ValueRichtextMixin = {
  name: 'valuerichtext-mixin',
  attributes: {
    required: {
      type: Boolean,
      default: false,
    },
  },
  getValue() {
    return this.quill.root.innerHTML;
  },
}

export {
  ValueRichtextMixin
}