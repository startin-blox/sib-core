const MailtoMixin = {
  name: 'mailto-mixin',
  created() {
    this.listAttributes['mailto'] = 'mailto:';
  }
}

export {
  MailtoMixin
}