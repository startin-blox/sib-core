const FormMixin = {
  name: 'form-mixin',
  getValue() {
    if (!this.dataHolder) return this.value;
    return this.dataHolder.value;
  },
  get dataHolder(): Element[] | null {
    const dataHolders = Array.from((this.element as Element).querySelectorAll('[data-holder]'));
    const widgetDataHolders = dataHolders.filter(element => {
      const dataHolderAncestor = element.parentElement ? element.parentElement.closest('[data-holder]') : null;
      // get the dataHolder of the widget only if no dataHolder ancestor in the current widget
      return dataHolderAncestor === this.element || !dataHolderAncestor || !this.element.contains(dataHolderAncestor)
    });

    return widgetDataHolders.length ? widgetDataHolders : null;
  }
}

export {
  FormMixin
}