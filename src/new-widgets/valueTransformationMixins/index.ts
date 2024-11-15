import { DateMixin } from './dateMixin';
import { DateTimeMixin } from './dateTimeMixin';
import { MultilineMixin } from './multilineMixin';
import { MarkdownMixin } from './markdownMixin.js';
import { OembedMixin } from './oembedMixin';
import { AutolinkMixin } from './autolinkMixin';

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
