import { unsafeHTML } from 'lit-html/directives/unsafe-html';

const OembedMixin = {
  name: 'oembed-mixin',
  initialState : {
    existingOembed: null,
  },
  created(): void {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  async transformValue(value: string, listValueTransformations: Function[]) {
    if (!value) return;
    if (this.existingOembed == null) {
      const response = await fetch(this.value);
      this.existingOembed = await response.json();
    }
    const newValue = unsafeHTML(this.existingOembed.html);
      
    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  OembedMixin
}