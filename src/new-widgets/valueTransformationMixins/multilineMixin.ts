import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { PostProcessorRegistry } from '../../libs/PostProcessorRegistry';

const MultilineMixin = {
  name: 'multiline-mixin',
  created() {
    this.listValueTransformations.attach(this.transformValue.bind(this), "MultilineMixin:transformValue");
  },
  transformValue(value: string, listValueTransformations: PostProcessorRegistry) {
    const newValue = value ? unsafeHTML(value.replace(/\n/g, "<br/>")) : value;

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  MultilineMixin
}