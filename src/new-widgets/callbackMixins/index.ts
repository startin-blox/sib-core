import { AutocompletionMixin } from './autocompletionMixin';
import { RichtextMixin } from './richtextMixin';

const callbackDirectory = {
  autocompletion: AutocompletionMixin,
  richtext: RichtextMixin,
}

export {
  callbackDirectory,
  AutocompletionMixin,
  RichtextMixin,
}
