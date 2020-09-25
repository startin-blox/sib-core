import { deltaToMarkdown } from 'quill-delta-to-markdown';

const ValueRichtextMixin = {
  name: 'valuerichtext-mixin',
  
  getValue() {
    const markdown = deltaToMarkdown(this.quill.getContents().ops);
    return markdown;
  },
}

export {
  ValueRichtextMixin
}