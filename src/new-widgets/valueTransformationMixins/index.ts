import { DateMixin } from './dateMixin.js';
import { DateTimeMixin } from './dateTimeMixin.js';
import { MultilineMixin } from './multilineMixin.js';
import { HtmlMixin } from './htmlMixin.js'

const valueTransformationDirectory = {
  date: DateMixin,
  datetime: DateTimeMixin,
  multiline: MultilineMixin,
  html: HtmlMixin,
}

export {
  valueTransformationDirectory,
  DateMixin,
  DateTimeMixin,
  MultilineMixin,
  HtmlMixin,
}
