import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry.ts';

const MultilineMixin = {
  name: 'multiline-mixin',
  created() {
    this.listValueTransformations.attach(
      this.transformValue.bind(this),
      'MultilineMixin:transformValue',
    );
  },
  transformValue(
    value: string,
    listValueTransformations: PostProcessorRegistry,
  ) {
    const newValue = value ? unsafeHTML(value.replace(/\n/g, '<br/>')) : value;

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(newValue, listValueTransformations);
  },
};

export { MultilineMixin };
