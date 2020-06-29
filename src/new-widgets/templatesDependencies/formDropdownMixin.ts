const FormDropdownMixin = {
  name: 'form-dropdown-mixin',
  attributes: {
    values: { // used to set more than 1 value, for multiple select
      type: String,
      default: '',
      callback: function(value) {
        if (value) {
          try {
            this.listAttributes['values'] = JSON.parse(value);
          } catch (e) {
            console.error(e);
            this.listAttributes['values'] = [];
          }
          this.planRender();
        }
      }
    },
  },
  attached() {
    this.listAttributes['values'] = [];
    if (this.multiple) this.listAttributes['multiple'] = true;
  },
  getValue() {
    if (!this.dataHolder) return undefined; // no value
    if (!this.multiple) return this.dataHolder[0].value; // simple select

    // multiple select
    const options = Array.from(this.element.querySelectorAll('option')) as HTMLOptionElement[];
    return options.filter(el => el.selected).map(el => el.value ? JSON.parse(el.value) : null)
  },
  get multiple() {
    return this.element.hasAttribute('multiple');
  }
}

export {
  FormDropdownMixin
}