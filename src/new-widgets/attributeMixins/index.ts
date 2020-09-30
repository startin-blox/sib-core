import { MultipleMixin } from './multipleMixin';
import { ActionMixin } from './actionMixin';
import { BlankMixin } from './blankMixin';
import { MailtoMixin } from './mailtoMixin';
import { TelMixin } from './telMixin';
import { PlaceholderMixin } from './placeholderMixin';

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
