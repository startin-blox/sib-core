const DateMixin = {
  name: 'date-mixin',
  created() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    if (!value) return;
    this.listAttributes['originalValue'] = value; // workaround for giving a non-formatted value to the form widget
    const newValue = new Date(value).toLocaleDateString();

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  DateMixin
}