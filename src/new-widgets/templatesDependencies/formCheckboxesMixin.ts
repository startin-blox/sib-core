const FormCheckboxesMixin = {
  name: 'form-checkboxes-mixin',
  attributes: {
    values: {
      type: String,
      default: '',
      callback: function (value: string) {
        if (!value) return;
        try {
          this.listAttributes['values'] = JSON.parse(value);
        } catch (e) {
          console.error(e);
          this.listAttributes['values'] = [];
        }
        this.render();
        this.dispatchEvent(new Event('change'));
      }
    },
  },
  created() {
    this.listAttributes['values'] = [];
  },
  getValue() {
    const options = Array.from(this.element.querySelectorAll('input')) as HTMLInputElement[];
    return options
      .filter(el => el.checked)
      .map(el => el.value ? JSON.parse(el.value) : null)
  },
  get type() {
    return  this.enum === ''? 'resource' : 'string';
  },
  get multiple() {
    return true;
  }
}

export {
  FormCheckboxesMixin
}