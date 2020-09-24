const DateMixin = {
  name: 'date-mixin',
  created() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    try {
      // workaround for giving a specific-formatted value to the form widget
      this.listAttributes['originalValue'] = this.formatDateForInput(value);
    } catch (e) {
      console.warn('Invalid date format for widget', this.name);
      this.listAttributes['originalValue'] = '';
    }
    const newValue = value ? new Date(value).toLocaleDateString() : value;

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(newValue, listValueTransformations);
  },
  formatDateForInput(date: string) {
    let d = new Date(date);
    if (isNaN(d.getTime())) throw new Error('Invalid date');
    let month = `${d.getMonth() + 1}`;
    let day = `${d.getDate()}`;
    let year = d.getFullYear();

    if (month.length < 2) month = `0${month}`;
    if (day.length < 2) day = `0${day}`;

    return [year, month, day].join('-');
  }
}

export {
  DateMixin
}