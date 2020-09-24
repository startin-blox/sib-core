//@ts-ignore
import { unsafeHTML } from  'https://unpkg.com/lit-html/directives/unsafe-html?module';

import 'https://cdnjs.cloudflare.com/ajax/libs/markdown-it/11.0.1/markdown-it.min.js';

const MarkdownMixin = {
  name: 'markdown-mixin',
  created() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    if (!value) return;
    const md = window.markdownit();
    const html = md.render(value);
    
    const newValue = unsafeHTML(html);

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  MarkdownMixin
}