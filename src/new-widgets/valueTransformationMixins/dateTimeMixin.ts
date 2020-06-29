const DateTimeMixin = {
  name: 'date-time-mixin',
  attached() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    if (!value) return;
    const newValue = new Date(value).toLocaleString();

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  }
}

export {
  DateTimeMixin
}