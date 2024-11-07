import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import markdownit from 'markdown-it';
import mila from 'markdown-it-link-attributes';
import { PostProcessorRegistry } from '../../libs/PostProcessorRegistry';

const MarkdownMixin = {
  name: 'markdown-mixin',
  created() {
    this.listValueTransformations.attach(this.transformValue.bind(this), "MarkdownMixin:transformValue");
  },
  transformValue(value: string, listValueTransformations: PostProcessorRegistry) {
    let newValue: any = '';
    if (value) {
      const md = markdownit({
        breaks: true,
        html: false,
        linkify: true,
      });

      md.use(mila, {
        attrs: {
          target: '_blank',
          rel: 'noopener',
        }
      });

      const html = md.render(value);
      newValue = unsafeHTML(html);
    }

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  MarkdownMixin
}