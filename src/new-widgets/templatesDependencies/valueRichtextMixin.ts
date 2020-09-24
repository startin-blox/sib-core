//@ts-ignore
import { deltaToMarkdown } from 'https://jspm.dev/quill-delta-to-markdown';

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