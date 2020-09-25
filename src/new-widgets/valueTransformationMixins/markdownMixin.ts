import { unsafeHTML } from 'lit-html/directives/unsafe-html';

import markdownit from 'markdown-it';

const MarkdownMixin = {
  name: 'markdown-mixin',
  created() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    if (!value) return;
    const md = markdownit();
    const html = md.render(value);
    
    const newValue = unsafeHTML(html);

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  MarkdownMixin
}