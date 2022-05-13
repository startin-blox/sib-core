import tinymce from 'tinymce';
// import TurndownService from 'turndown';
import showdown from 'showdown';
const ValueEditorMixin = {
  name: 'valueeditor-mixin',

  getValue() {
    const converter = new showdown.Converter();
    converter.setOption('simpleLineBreaks', true);
    const markdown = converter.makeMarkdown(tinymce.get('data-editor').getContent());
    return markdown;
  },
}

export {
  ValueEditorMixin
}