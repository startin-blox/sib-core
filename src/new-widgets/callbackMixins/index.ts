import { AutocompletionMixin } from './autocompletionMixin';
import { RichtextMixin } from './richtextMixin';
import { EditorMixin } from './editorMixin';

const callbackDirectory = {
  autocompletion: AutocompletionMixin,
  richtext: RichtextMixin,
  editor: EditorMixin
}

export {
  callbackDirectory,
  AutocompletionMixin,
  RichtextMixin,
  EditorMixin
}
