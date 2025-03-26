import type Quill from 'quill';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
const ValueRichtextMixin = {
  name: 'valuerichtext-mixin',

  getValue() {
    const ops = (this.quill as Quill).getContents().ops;
    const converter = new QuillDeltaToHtmlConverter(ops, {
      multiLineParagraph: false,
    });
    return converter.convert();
  },
};

export { ValueRichtextMixin };
