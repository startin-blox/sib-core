import { DateMixin } from './dateMixin';
import { DateTimeMixin } from './dateTimeMixin';
import { MultilineMixin } from './multilineMixin';
import { MarkdownMixin } from './markdownMixin.js';
import { OembedMixin } from './oembedMixin';

const valueTransformationDirectory = {
  date: DateMixin,
  datetime: DateTimeMixin,
  multiline: MultilineMixin,
  markdown: MarkdownMixin,
  oembed:OembedMixin,
}

export {
  valueTransformationDirectory,
  DateMixin,
  DateTimeMixin,
  MultilineMixin,
  MarkdownMixin,
  OembedMixin,
}
