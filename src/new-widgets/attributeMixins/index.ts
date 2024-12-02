import { ActionMixin } from './actionMixin.ts';
import { BlankMixin } from './blankMixin.ts';
import { BooleanMixin } from './booleanMixin.ts';
import { MailtoMixin } from './mailtoMixin.ts';
import { MultipleMixin } from './multipleMixin.ts';
import { NumberMixin } from './numberMixin.ts';
import { PlaceholderMixin } from './placeholderMixin.ts';
import { TelMixin } from './telMixin.ts';

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
