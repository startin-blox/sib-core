import { AutolinkMixin } from './autolinkMixin.ts';
import { DateMixin } from './dateMixin.ts';
import { DateTimeMixin } from './dateTimeMixin.ts';
import { MarkdownMixin } from './markdownMixin.js';
import { MultilineMixin } from './multilineMixin.ts';
import { OembedMixin } from './oembedMixin.ts';

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
