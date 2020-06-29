const FormMixin = {
  name: 'form-mixin',
  getValue() {
    if (!this.dataHolder) return this.value;
    if (this.dataHolder.length >= 1) return this.dataHolder[0].value; // TODO : getValueHolder
    return undefined;
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