import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry.ts';

const DateTimeMixin = {
  name: 'date-time-mixin',
  created() {
    this.listValueTransformations.attach(
      this.transformValue.bind(this),
      'DateTimeMixin:transformValue',
    );
  },
  transformValue(
    value: string,
    listValueTransformations: PostProcessorRegistry,
  ) {
    const newValue = value ? new Date(value).toLocaleString() : value;

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(newValue, listValueTransformations);
  },
};

export { DateTimeMixin };
