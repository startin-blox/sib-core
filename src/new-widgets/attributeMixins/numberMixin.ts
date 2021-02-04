const NumberMixin = {
  name: 'number-mixin',
  transformValue(value: string, listValueTransformations: Function[]) {
    const newValue = Number(value);
    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(newValue, listValueTransformations);
  },
  get type() {
    return 'number';
  },
};

export { NumberMixin };
