import tinymce from 'tinymce';
import 'tinymce/themes/silver';
import 'tinymce/models/dom';
import 'tinymce/icons/default';
import { importCSS } from '../../libs/helpers';
import { uniqID } from '../../libs/helpers';

import 'tinymce/plugins/lists/plugin.js';
import 'tinymce/plugins/link/plugin.js';
import 'tinymce/plugins/autoresize/plugin.js';

import showdown from 'showdown';

const EditorMixin = {
  name: 'editor-mixin',
  initialState: {
    tinymce: null,
  },

  created() {
    importCSS('https://cdn.skypack.dev/tinymce/skins/ui/oxide/skin.css');
    importCSS('https://cdn.skypack.dev/tinymce/skins/content/default/content.css');
    importCSS('https://cdn.skypack.dev/tinymce/skins/ui/oxide/content.css');
    this.tinymce = null;
    this.listAttributes['id'] = uniqID();
    this.listCallbacks.push(this.addCallback.bind(this));
  },
  addCallback(value: string, listCallbacks: Function[]) {
    //set value in editor (markdown format transform in html to edit it)

    if (this.tinymce == null) {
      const converter = new showdown.Converter();
      const htmlValue = converter.makeHtml(this.value);
      console.log('init', this.listAttributes['id']);
      tinymce.init({
        selector: '#' + this.listAttributes['id'],
        max_height: 500,
        min_height: 120,
        resize: true,
        menubar: false,
        plugins: [
          'lists', 'link', 'autoresize'
        ],
        toolbar: 'styles | bold italic | blockquote | bullist numlist | link | removeformat',
        style_formats: [
          { title: 'Normal', format: 'p' },
          {
            title: 'Headings', items: [
              { title: 'Heading 1', format: 'h1' },
              { title: 'Heading 2', format: 'h2' },
              { title: 'Heading 3', format: 'h3' },
              { title: 'Heading 4', format: 'h4' },
              { title: 'Heading 5', format: 'h5' },
              { title: 'Heading 6', format: 'h6' }
            ]
          }
        ],
        //to avoid simple line break
        setup: function (editor) {
          editor.on('keydown', function (event) {
            if (event.code == 'Enter' && event.shiftKey) {
              event.preventDefault();
              event.stopPropagation();
              return false;
            } else return true;
          })
          editor.on('init', function() {
            editor.setContent(htmlValue);
          })
        }
      });
      if(this.value) {
        const converter = new showdown.Converter();
        const htmlValue = converter.makeHtml(this.value);
        tinymce.get(this.listAttributes['id']).setContent(htmlValue);
      }
    }
    const nextProcessor = listCallbacks.shift();
    if (nextProcessor) nextProcessor(value, listCallbacks);
  },
}

export {
  EditorMixin
}