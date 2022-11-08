import { unsafeHTML } from 'lit-html/directives/unsafe-html';

import markdownit from 'markdown-it';

const MarkdownMixin = {
  name: 'markdown-mixin',
  created() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    let newValue: any = '';
    if (value) {
      const md = markdownit({
        breaks: true,
        html: false
      });

      const html = md.render(value);
      newValue = unsafeHTML(html);
    }

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  MarkdownMixin
}