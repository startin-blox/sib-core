const FilterRangeFormMixin = {
  name: 'filter-range-form-mixin',
  attributes: {
    startValue: {
      type: String,
      default:'',
      callback: function (value: string) {
        if (value == "today") {
          const today = new Date().toISOString().split("T")[0];
          this.addToAttributes(today, "startValue");
        } else this.addToAttributes(value, "startValue");
      }
    },
    endValue: {
      type: String,
      default:'',
      callback: function (value: string) {
        this.addToAttributes(value, "endValue")
      }
    }
  },
  getValue() {
    if (!this.dataHolder) return [];
    if (this.dataHolder.length !== 2) this.showDataHolderError(2, this.dataHolder.length);
    return [ // we expect 2 values, one min and one max
      this.getValueFromElement(this.dataHolder[0]),
      this.getValueFromElement(this.dataHolder[1])
    ]
  },
  get type() {
    return 'range';
  },
}

export {
  FilterRangeFormMixin
}