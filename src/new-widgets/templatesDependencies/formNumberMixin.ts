const FormNumberMixin = {
  name: 'form-number-mixin',
  getValueFromElement(element: any) {
    return element.value ? Number(element.value) : '';
  },
  get type() {
    return 'number';
  },
};

export { FormNumberMixin };
