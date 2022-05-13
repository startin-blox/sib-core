import tinymce from 'tinymce';
// import TurndownService from 'turndown';
import showdown from 'showdown';
const ValueEditorMixin = {
  name: 'valueeditor-mixin',

  getValue() {
    // console.log(tinymce.get('data-editor').getContent());
    const converter = new showdown.Converter();
    converter.setOption('simpleLineBreaks', true);
    var myOption = showdown.getDefaultOptions();
    console.log(myOption);
    const markdown = converter.makeMarkdown(tinymce.get('data-editor').getContent());
    // console.log(markdown);
    return markdown;
  },
}

export {
  ValueEditorMixin
}