import tinymce from 'tinymce';

const EditorMixin = {
  name: 'editor-mixin',
  initialState:{
    tinymce: null,
  },

  created() {
    // //@ts-ignore
    // import('../../../node_modules/tinymce/tinymce.min.js');

    this.tinymce = null;
    this.listCallbacks.push(this.addCallback.bind(this));
  },
  addCallback(value: string, listCallbacks: Function[]) {
    const editor = this.element.querySelector('[data-editor]');
    tinymce.init({
      selector: editor,
      height: 500,
      menubar: false,
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