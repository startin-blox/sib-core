import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry';

const DateMixin = {
  name: 'date-mixin',
  created() {
    this.listValueTransformations.attach(
      this.transformValue.bind(this),
      'DateMixin:transformValue',
    );
  },
  transformValue(
    value: string,
    listValueTransformations: PostProcessorRegistry,
  ) {
    try {
      // workaround for giving a specific-formatted value to the form widget
      this.listAttributes.originalValue = this.formatDateForInput(value);
    } catch (e) {
      console.warn('Invalid date format for widget', this.name);
      this.listAttributes.originalValue = '';
    }
    const newValue = value ? new Date(value).toLocaleDateString() : value;

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(newValue, listValueTransformations);
  },
  formatDateForInput(date: string) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
    let month = `${d.getMonth() + 1}`;
    let day = `${d.getDate()}`;
    const year = d.getFullYear();

    if (month.length < 2) month = `0${month}`;
    if (day.length < 2) day = `0${day}`;

    return [year, month, day].join('-');
  },
};

export { DateMixin };
