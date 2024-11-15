const FilterRangeFormMixin = {
  name: 'filter-range-form-mixin',
  attributes: {
    startValue: {
      type: String,
      default: '',
      callback: function (value: string) {
        this.addToAttributes(this.getDefaultValue(value), 'startValue');
      },
    },
    endValue: {
      type: String,
      default: '',
      callback: function (value: string) {
        this.addToAttributes(this.getDefaultValue(value), 'endValue');
      },
    },
  },
  getDefaultValue(value) {
    if (value == 'today') return new Date().toISOString().split('T')[0];
    return value;
  },
  getValue() {
    if (!this.dataHolder) return [];
    if (this.dataHolder.length !== 2)
      this.showDataHolderError(2, this.dataHolder.length);
    return [
      // we expect 2 values, one min and one max
      this.getValueFromElement(this.dataHolder[0]),
      this.getValueFromElement(this.dataHolder[1]),
    ];
  },
  get type() {
    return 'range';
  },
};

export { FilterRangeFormMixin };
