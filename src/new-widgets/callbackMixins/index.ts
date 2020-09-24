import { AutolinkMixin } from './autolinkMixin.js';
import { AutocompletionMixin } from './autocompletionMixin.js';
import { RichtextMixin } from './richtextMixin.js';

const callbackDirectory = {
  autolink: AutolinkMixin,
  autocompletion: AutocompletionMixin,
  richtext: RichtextMixin
}

export {
  callbackDirectory,
  AutolinkMixin,
  AutocompletionMixin,
  RichtextMixin
}
