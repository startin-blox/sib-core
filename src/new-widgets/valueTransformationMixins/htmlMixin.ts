//@ts-ignore
import { unsafeHTML } from  'https://unpkg.com/lit-html/directives/unsafe-html?module';

const HtmlMixin = {
  name: 'html-mixin',
  created() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    if (!value) return;
    const newValue = unsafeHTML(value);

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  HtmlMixin
}