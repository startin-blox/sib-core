const FormNumberMixin = {
  name: 'form-number-mixin',
  getValueFromElement(element: any) {
    return element.value ? Number(element.value) : '';
  }
}

export {
  FormNumberMixin
}