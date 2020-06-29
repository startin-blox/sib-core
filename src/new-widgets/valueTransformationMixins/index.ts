import { DateMixin } from './dateMixin.js';
import { DateTimeMixin } from './dateTimeMixin.js';
import { MultilineMixin } from './multilineMixin.js';

const valueTransformationDirectory = {
  date: DateMixin,
  datetime: DateTimeMixin,
  multiline: MultilineMixin,
}

export {
  valueTransformationDirectory,
  DateMixin,
  DateTimeMixin,
  MultilineMixin,
}
