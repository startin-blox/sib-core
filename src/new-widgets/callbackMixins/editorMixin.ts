import tinymce from 'tinymce/tinymce';
import 'tinymce/themes/silver';
// //@ts-ignore
import 'tinymce/models/dom';
// //@ts-ignore
import 'tinymce/icons/default';
// //@ts-ignore
import 'tinymce/skins/ui/oxide/skin.min.css';
// //@ts-ignore
import 'tinymce/skins/content/default/content.css';
// //@ts-ignore
import 'tinymce/skins/ui/oxide/content.min.css';


const EditorMixin = {
  name: 'editor-mixin',

  created() {
    console.log("created editor mixin");
    // this.tinymce = null;
    this.listCallbacks.push(this.addCallback.bind(this));
  },
  addCallback(value: string, listCallbacks: Function[]) {
    const editor = this.element.querySelector('[data-editor]');
    console.log("Goin through the callback", editor);
    tinymce.init({
      selector: "div[data-editor]",
      height: 500,
      menubar: true,
      plugins: [
        'lists', 'link'
      ],
      toolbar: 'styles | blockquote | ' + 
      'bold italic' + 
      'alignright alignjustify | bullist numlist outdent indent | ' + 
      'removeformat'
    });
      const nextProcessor = listCallbacks.shift();
      if (nextProcessor) nextProcessor(value, listCallbacks); 
  },
}

export {
  EditorMixin
}