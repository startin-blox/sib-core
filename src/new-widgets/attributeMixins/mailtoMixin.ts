//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';

const MailtoMixin = {
  name: 'mailto-mixin',
  attached() {
    this.listAttributes['mailto'] = 'mailto:';
  }
}

export {
  MailtoMixin
}