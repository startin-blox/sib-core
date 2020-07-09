import { MultipleMixin } from './multipleMixin.js';
import { ActionMixin } from './actionMixin.js';
import { BlankMixin } from './blankMixin.js';
import { MailtoMixin } from './mailtoMixin.js';
import { TelMixin } from './telMixin.js';
import { PlaceholderMixin } from './placeholderMixin.js';

const attributeDirectory = {
  multiple: MultipleMixin,
  action: ActionMixin,
  blank: BlankMixin,
  mailto: MailtoMixin,
  tel: TelMixin,
  placeholder: PlaceholderMixin,
}

export {
  attributeDirectory,
  MultipleMixin,
  ActionMixin,
  BlankMixin,
  MailtoMixin,
  TelMixin,
  PlaceholderMixin,
}
