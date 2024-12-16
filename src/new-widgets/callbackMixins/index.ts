import { AutocompletionMixin } from './autocompletionMixin.ts';
import { EditorMixin } from './editorMixin.ts';
import { RichtextMixin } from './richtextMixin.ts';

const callbackDirectory = {
  autocompletion: AutocompletionMixin,
  richtext: RichtextMixin,
  editor: EditorMixin,
};

export { callbackDirectory, AutocompletionMixin, RichtextMixin, EditorMixin };
