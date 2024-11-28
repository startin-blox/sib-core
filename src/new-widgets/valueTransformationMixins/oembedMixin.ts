import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry.ts';

const OembedMixin = {
  name: 'oembed-mixin',
  initialState: {
    existingOembed: null,
  },
  created(): void {
    this.listValueTransformations.attach(
      this.transformValue.bind(this),
      'OembedMixin:transformValue',
    );
  },
  async transformValue(
    value: string,
    listValueTransformations: PostProcessorRegistry,
  ) {
    if (!value) return;
    if (this.existingOembed == null) {
      const response = await fetch(this.value);
      this.existingOembed = await response.json();
    }
    const newValue = unsafeHTML(this.existingOembed.html);

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(newValue, listValueTransformations);
  },
};

export { OembedMixin };
