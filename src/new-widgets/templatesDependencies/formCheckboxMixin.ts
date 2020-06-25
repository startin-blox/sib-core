const FormCheckboxMixin = {
  name: 'form-checkbox-mixin',
  getValue() {
    if (this.dataHolder.length < 1) return undefined;
    return this.dataHolder[0].checked;
  },
}

export {
  FormCheckboxMixin
}