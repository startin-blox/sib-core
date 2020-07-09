const FormCheckboxMixin = {
  name: 'form-checkbox-mixin',
  getValueFromElement(element: any) {
    return element.checked;
  }
}

export {
  FormCheckboxMixin
}