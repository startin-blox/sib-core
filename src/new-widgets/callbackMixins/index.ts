import { AutolinkMixin } from './autolinkMixin';
import { AutocompletionMixin } from './autocompletionMixin';
import { RichtextMixin } from './richtextMixin';

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
