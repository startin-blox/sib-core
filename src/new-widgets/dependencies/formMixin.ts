const FormMixin = {
  name: 'form-mixin',
  getValue() {
    const dataHolder = this.element.querySelector('[data-holder]');
    if (!dataHolder) return this.value;
    if (dataHolder instanceof HTMLInputElement && dataHolder.type == "checkbox") return dataHolder.checked;
    return dataHolder.value;
  },
}

export {
  FormMixin
}