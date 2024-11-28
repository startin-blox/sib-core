import { AutocompletionMixin } from './autocompletionMixin.ts';
import { RichtextMixin } from './richtextMixin.ts';

const callbackDirectory = {
  autocompletion: AutocompletionMixin,
  richtext: RichtextMixin,
};

export { callbackDirectory, AutocompletionMixin, RichtextMixin };
