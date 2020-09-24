import { unsafeHTML } from 'lit-html/directives/unsafe-html';

const MultilineMixin = {
  name: 'multiline-mixin',
  created() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    const newValue = value ? unsafeHTML(value.replace(/\n/g, "<br/>")) : value;

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  MultilineMixin
}