const FormCheckboxMixin = {
  name: 'form-checkbox-mixin',
  getValueFromElement(element: any) {
    return element.checked;
  },
  get type() {
    return 'boolean';
  },
};

export { FormCheckboxMixin };
