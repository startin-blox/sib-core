import tinymce from 'tinymce';
// import TurndownService from 'turndown';
import showdown from 'showdown';
const ValueEditorMixin = {
  name: 'valueeditor-mixin',

  getValue() {
    const editor = document.getElementById(this.listAttributes['id']);
    if (editor == null) return;
    const converter = new showdown.Converter();
    converter.setOption('simpleLineBreaks', false);
    const markdown = converter.makeMarkdown(tinymce.get(editor.id).getContent());
    return markdown;
  },
}

export {
  ValueEditorMixin
}