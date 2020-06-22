//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';

const BlankMixin = {
  name: 'blank-mixin',
  attached() {
    this.listAttributes['target'] = '_blank';
  }
}

export {
  BlankMixin
}