import { ActionMixin } from './actionMixin';
import { BlankMixin } from './blankMixin';
import { BooleanMixin } from './booleanMixin';
import { MailtoMixin } from './mailtoMixin';
import { MultipleMixin } from './multipleMixin';
import { NumberMixin } from './numberMixin';
import { PlaceholderMixin } from './placeholderMixin';
import { TelMixin } from './telMixin';

const attributeDirectory = {
  multiple: MultipleMixin,
  action: ActionMixin,
  blank: BlankMixin,
  mailto: MailtoMixin,
  tel: TelMixin,
  placeholder: PlaceholderMixin,
  bool: BooleanMixin,
  num: NumberMixin,
};

export {
  attributeDirectory,
  MultipleMixin,
  ActionMixin,
  BlankMixin,
  MailtoMixin,
  TelMixin,
  PlaceholderMixin,
};
