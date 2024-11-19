import { AutolinkMixin } from './autolinkMixin';
import { DateMixin } from './dateMixin';
import { DateTimeMixin } from './dateTimeMixin';
import { MarkdownMixin } from './markdownMixin.js';
import { MultilineMixin } from './multilineMixin';
import { OembedMixin } from './oembedMixin';

const valueTransformationDirectory = {
  date: DateMixin,
  datetime: DateTimeMixin,
  multiline: MultilineMixin,
  markdown: MarkdownMixin,
  oembed: OembedMixin,
  autolink: AutolinkMixin,
};

export {
  valueTransformationDirectory,
  DateMixin,
  DateTimeMixin,
  MultilineMixin,
  MarkdownMixin,
  OembedMixin,
  AutolinkMixin,
};
