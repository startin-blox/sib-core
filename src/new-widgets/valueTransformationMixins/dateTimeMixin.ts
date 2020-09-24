const DateTimeMixin = {
  name: 'date-time-mixin',
  created() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    const newValue = value ? new Date(value).toLocaleString() : value;

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  DateTimeMixin
}