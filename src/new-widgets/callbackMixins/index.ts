import { AutolinkMixin } from './autolinkMixin.js';
import { AutocompletionMixin } from './autocompletionMixin.js';

const callbackDirectory = {
  autolink: AutolinkMixin,
  autocompletion: AutocompletionMixin,
}

export {
  callbackDirectory,
  AutolinkMixin,
  AutocompletionMixin
}
