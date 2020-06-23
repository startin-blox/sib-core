//@ts-ignore
import { unsafeHTML } from 'https://unpkg.com/lit-html/directives/unsafe-html?module';

const MultilineMixin = {
  name: 'multiline-mixin',
  attached() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    if (!value) return;
    const newValue = unsafeHTML(value.replace(/\n/g, "<br/>"));

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  MultilineMixin
}