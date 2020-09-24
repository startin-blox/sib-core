import { DateMixin } from './dateMixin.js';
import { DateTimeMixin } from './dateTimeMixin.js';
import { MultilineMixin } from './multilineMixin.js';
import { MarkdownMixin } from './markdownMixin.js'

const valueTransformationDirectory = {
  date: DateMixin,
  datetime: DateTimeMixin,
  multiline: MultilineMixin,
  markdown: MarkdownMixin,
}

export {
  valueTransformationDirectory,
  DateMixin,
  DateTimeMixin,
  MultilineMixin,
  MarkdownMixin,
}
