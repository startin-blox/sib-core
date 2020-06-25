const MailtoMixin = {
  name: 'mailto-mixin',
  attached() {
    this.listAttributes['mailto'] = 'mailto:';
  }
}

export {
  MailtoMixin
}