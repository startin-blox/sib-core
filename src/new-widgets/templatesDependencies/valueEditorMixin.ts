import showdown from 'showdown';
import tinymce from 'tinymce';

const ValueEditorMixin = {
  name: 'valueeditor-mixin',

  getValue() {
    const editor = document.getElementById(this.listAttributes.id);
    if (editor == null) return;

    const converter = new showdown.Converter();
    const editorObj = tinymce.get(editor.id);
    if (editorObj == null) return;

    const markdown = converter.makeMarkdown(editorObj.getContent());
    const comment = '<!-- -->\n\n';
    return markdown.includes(comment)
      ? markdown.split(comment).join('')
      : markdown;
  },
};

export { ValueEditorMixin };
