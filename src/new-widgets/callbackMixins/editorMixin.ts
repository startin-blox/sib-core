import tinymce from 'tinymce';


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
      toolbar: 'styles | bold italic underline | blockquote | indent outdent | bullist numlist | link | removeformat',
    });
      const nextProcessor = listCallbacks.shift();
      if (nextProcessor) nextProcessor(value, listCallbacks); 
  },
}

export {
  EditorMixin
}