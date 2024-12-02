import qdtm from 'quill-delta-to-markdown';
const ValueRichtextMixin = {
  name: 'valuerichtext-mixin',

  getValue() {
    const markdown = qdtm.deltaToMarkdown(this.quill.getContents().ops);
    return markdown;
  },
};

export { ValueRichtextMixin };
