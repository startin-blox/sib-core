const FormDropdownMixin = {
  name: 'form-dropdown-mixin',
  attributes: {
    values: {
      // used to set more than 1 value, for multiple select
      type: String,
      default: '',
      callback: function (value) {
        if (value) {
          try {
            this.listAttributes.values = JSON.parse(value);
          } catch (e) {
            console.error(e);
            this.listAttributes.values = [];
          }
          this.render(); // use render to make sure the dispatch always happen after
          this.dispatchChange();
        }
      },
    },
    dataId: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'id');
      },
    },
  },
  created() {
    this.listAttributes.values = [];
    if (
      this.listAttributes.value &&
      !JSON.parse(this.listAttributes.value['@id']) &&
      Array.isArray(JSON.parse(this.listAttributes.value))
    ) {
      this.listAttributes.values = this.listAttributes.value;
    }
    if (this.multiple) this.listAttributes.multiple = true;
  },
  dispatchChange() {
    if (!this.element.querySelector('select')) return;
    this.element.querySelector('select').dispatchEvent(new Event('change'));
  },
  getValue() {
    if (!this.dataHolder) return ''; // no value
    if (!this.multiple) {
      // simple select
      if (this.dataHolder.length > 1)
        this.showDataHolderError(1, this.dataHolder.length);
      return this.getValueFromElement(this.dataHolder[0]);
    }

    // multiple select
    const options = Array.from(
      this.element.querySelectorAll('option'),
    ) as HTMLOptionElement[];
    return options
      .filter(el => el.selected)
      .map(el => (el.value ? JSON.parse(el.value) : null));
  },
  get type() {
    return this.enum === '' ? 'resource' : 'string';
  },
  get multiple() {
    return this.element.hasAttribute('multiple');
  },
};

export { FormDropdownMixin };
