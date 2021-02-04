const BooleanMixin = {
  name: 'boolean-mixin',
  transformValue(value: string, listValueTransformations: Function[]) {
    const newValue = value !== 'false';

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(newValue, listValueTransformations);
  },
  get type() {
    return 'boolean';
  },
};

export { BooleanMixin };
