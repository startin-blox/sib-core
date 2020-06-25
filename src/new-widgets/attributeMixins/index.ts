import { MultipleMixin } from './multipleMixin.js';
import { BlankMixin } from './blankMixin.js';
import { MailtoMixin } from './mailtoMixin.js';
import { TelMixin } from './telMixin.js';
import { CheckboxMixin } from './checkboxMixin.js';

const attributeDirectory = {
  multiple: MultipleMixin,
  blank: BlankMixin,
  mailto: MailtoMixin,
  tel: TelMixin,
  checkbox: CheckboxMixin,
}

export {
  attributeDirectory,
  MultipleMixin,
  BlankMixin,
  MailtoMixin,
  TelMixin,
  CheckboxMixin,
}
