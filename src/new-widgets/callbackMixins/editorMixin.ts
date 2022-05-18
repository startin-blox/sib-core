import tinymce from 'tinymce';
import 'tinymce/themes/silver';
import 'tinymce/models/dom';
import 'tinymce/icons/default';
import { importCSS } from '../../libs/helpers';
import { uniqID } from '../../libs/helpers';

import 'tinymce/plugins/lists/plugin.js';
import 'tinymce/plugins/link/plugin.js';

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
    this.listCallbacks.push(this.addCallback.bind(this));
    this.listAttributes['id'] = uniqID();
  },
  addCallback(value: string, listCallbacks: Function[]) {
    //set value in editor (markdown format transform in html to edit it)
    let val = this.value;
    // console.log(this.value);
    const converter = new showdown.Converter();
    const htmlValue = converter.makeHtml(val);
    console.log(htmlValue);
    const editor = document.getElementById(this.listAttributes['id']);
    if (editor == null) return;
    if (this.tinymce == null) {
      tinymce.init({
        selector: '#'+editor.id,
        height: 500,
        menubar: false,
        plugins: [
          'lists', 'link'
        ],
        toolbar: 'styles | bold italic | blockquote | bullist numlist | link | removeformat',
        style_formats: [
          { title: 'Normal', format: 'p' },
          { title: 'Headings', items: [
              { title: 'Heading 1', format: 'h1' },
              { title: 'Heading 2', format: 'h2' },
              { title: 'Heading 3', format: 'h3' },
              { title: 'Heading 4', format: 'h4' },
              { title: 'Heading 5', format: 'h5' },
              { title: 'Heading 6', format: 'h6' }
            ]
          }
        ],
        //to avoid line break, not ok with markdown
        setup: function(editor) {
          editor.on('keydown', function(event) {
              if (event.code == 'Enter' && event.shiftKey)  {
                event.preventDefault();
                event.stopPropagation();
                return false;
              } else return true;
          });
        }
      });
      tinymce.get(editor.id).on('init', function (e) {
        e.target.setContent(htmlValue);
      });
    }
    const nextProcessor = listCallbacks.shift();
    if (nextProcessor) nextProcessor(value, listCallbacks);
  },
}

export {
  EditorMixin
}