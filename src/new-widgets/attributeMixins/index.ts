import { MultipleMixin } from './multipleMixin.js';
import { ActionMixin } from './actionMixin.js';
import { BlankMixin } from './blankMixin.js';
import { MailtoMixin } from './mailtoMixin.js';
import { TelMixin } from './telMixin.js';
import { CheckboxMixin } from './checkboxMixin.js';

const attributeDirectory = {
  multiple: MultipleMixin,
  action: ActionMixin,
  blank: BlankMixin,
  mailto: MailtoMixin,
  tel: TelMixin,
  checkbox: CheckboxMixin,
}

export {
  attributeDirectory,
  MultipleMixin,
  ActionMixin,
  BlankMixin,
  MailtoMixin,
  TelMixin,
  CheckboxMixin,
}
