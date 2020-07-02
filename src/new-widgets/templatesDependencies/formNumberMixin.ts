const FormNumberMixin = {
  name: 'form-number-mixin',
  getValueFromElement(element: any) {
    return Number(element.value);
  }
}

export {
  FormNumberMixin
}