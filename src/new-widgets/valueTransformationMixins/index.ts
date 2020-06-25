import { DateMixin } from './dateMixin.js';
import { MultilineMixin } from './multilineMixin.js';

const valueTransformationDirectory = {
  date: DateMixin,
  multiline: MultilineMixin,
}

export {
  valueTransformationDirectory,
  DateMixin,
  MultilineMixin,
}
