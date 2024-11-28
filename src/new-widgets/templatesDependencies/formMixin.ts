const FormMixin = {
  name: 'form-mixin',
  attributes: {
    required: {
      type: Boolean,
      default: false,
      callback: function () {
        this.listAttributes.required = true;
      },
    },
    autocomplete: {
      type: String,
      default: '',
      callback: function (value: string) {
        this.addToAttributes(value, 'autocomplete');
      },
    },
  },
  attached() {
    this.listAttributes.onChange = this.onChange.bind(this);
  },
  onChange(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.element.dispatchEvent(new Event('change', { bubbles: true }));
  },
  getValue() {
    if (!this.dataHolder || this.dataHolder.length === 0) return this.value;
    if (this.dataHolder.length > 1)
      this.showDataHolderError(1, this.dataHolder.length);
    return this.getValueFromElement(this.dataHolder[0]);
  },
  get type() {
    return 'string';
  },
  get multiple() {
    return false;
  },
  get dataHolder(): Element[] | null {
    const dataHolders = Array.from(
      (this.element as Element).querySelectorAll('[data-holder]'),
    );
    const widgetDataHolders = dataHolders.filter(element => {
      const dataHolderAncestor = element.parentElement
        ? element.parentElement.closest('[data-holder]')
        : null;
      // get the dataHolder of the widget only if no dataHolder ancestor in the current widget
      return (
        dataHolderAncestor === this.element ||
        !dataHolderAncestor ||
        !this.element.contains(dataHolderAncestor)
      );
    });

    return widgetDataHolders.length > 0 ? widgetDataHolders : null;
  },
  getValueFromElement(element: any) {
    return element.component ? element.component.getValue() : element.value;
  },
  showDataHolderError(expected: number, found: number) {
    console.warn(
      `Expected ${expected} data-holder element in ${this.element.tagName}. Found ${found}`,
    );
  },
};

export { FormMixin };
