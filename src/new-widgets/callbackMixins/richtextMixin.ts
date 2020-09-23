import { importCSS } from '../../libs/helpers.js';
//@ts-ignore
import Quill from 'https://jspm.dev/quill';

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
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        
        ['code', 'blockquote', 'code-block'],

        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false]}],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{'align': []}],
        
        ['link', 'image', 'video'],
        ['clean']
      ];
      const richtext = this.element.querySelector('[data-richtext]');
      this.quill = new Quill(richtext, {
        modules: {toolbar: toolbarOptions},
      theme: 'snow'});
    } else {
      this.quill.root.innerHTML=this.value;
    }
      const nextProcessor = listCallbacks.shift();
      if (nextProcessor) nextProcessor(value, listCallbacks); 
  },
}

export {
  RichtextMixin
}