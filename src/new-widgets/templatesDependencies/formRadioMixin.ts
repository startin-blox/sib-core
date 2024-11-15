import { uniqID } from '../../libs/helpers';

const FormRadioMixin = {
  name: 'form-radio-mixin',
  created() {
    this.listAttributes['id'] = uniqID();
  },
  getValue() {
    const checkedElement = this.element.querySelector(
      'input[type=radio]:checked',
    ) as HTMLInputElement;
    return checkedElement ? checkedElement.value : '';
  },
};

export { FormRadioMixin };
