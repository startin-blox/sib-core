import { importCSS } from '../../libs/helpers.js';
//@ts-ignore
import Quill from 'https://jspm.dev/quill';

//@ts-ignore
import deltaMd from 'https://jspm.dev/delta-markdown-for-quill';

const RichtextMixin = {
  name: 'richtext-mixin',
  initialState:{
    quill: null,
  },

  created() {
    importCSS('https://cdn.quilljs.com/1.3.6/quill.snow.css');
    this.quill = null;
    this.listCallbacks.push(this.addCallback.bind(this));
  },
  addCallback(value: string, listCallbacks: Function[]) {
    if (this.quill == null) {
      var toolbarOptions = [
        ['bold', 'italic'],
        
        ['blockquote'],

        [{ 'header': [1, 2, 3, 4, 5, 6, false]}],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        
        ['clean']
      ];
      const richtext = this.element.querySelector('[data-richtext]');
      this.quill = new Quill(richtext, {
        modules: {toolbar: toolbarOptions},
        theme: 'snow'});
      }
      const ops = deltaMd.toDelta(this.value);
      this.quill.setContents(ops);

      const nextProcessor = listCallbacks.shift();
      if (nextProcessor) nextProcessor(value, listCallbacks); 
  },
}

export {
  RichtextMixin
}