import { DateMixin } from './dateMixin';
import { DateTimeMixin } from './dateTimeMixin';
import { MultilineMixin } from './multilineMixin';
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
