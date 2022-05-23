import tinymce from 'tinymce';
// import TurndownService from 'turndown';
import showdown from 'showdown';
const ValueEditorMixin = {
  name: 'valueeditor-mixin',

  getValue() {
    const editor = document.getElementById(this.listAttributes['id']);
    if (editor == null) return;
    const converter = new showdown.Converter();
    let markdown = converter.makeMarkdown(tinymce.get(editor.id).getContent());
    const comment = '<!-- -->\n\n';
    return markdown.includes(comment) ? markdown.split(comment).join("") : markdown
  },
}

export {
  ValueEditorMixin
}