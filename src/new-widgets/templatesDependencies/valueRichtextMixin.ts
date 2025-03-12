import type Quill from 'quill';

const ValueRichtextMixin = {
  name: 'valuerichtext-mixin',

  getValue() {
    return (this.quill as Quill).getSemanticHTML();
  },
};

export { ValueRichtextMixin };
