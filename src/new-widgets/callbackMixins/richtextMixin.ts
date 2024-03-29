import Quill from 'quill';

import deltaMd from 'delta-markdown-for-quill';
import { importInlineCSS } from '../../libs/helpers.js';

const RichtextMixin = {
  name: 'richtext-mixin',
  initialState:{
    quill: null,
  },

  created() {
    importInlineCSS('quill', () => import('quill/dist/quill.snow.css?inline'))
    
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
        ['link'],
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