//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';

const TelMixin = {
  name: 'tel-mixin',
  attached() {
    this.listAttributes['tel'] = 'tel:';
  }
}

export {
  TelMixin
}