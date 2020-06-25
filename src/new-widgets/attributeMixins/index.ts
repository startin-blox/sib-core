import { MultipleMixin } from './multipleMixin.js';
import { BlankMixin } from './blankMixin.js';
import { MailtoMixin } from './mailtoMixin.js';
import { TelMixin } from './telMixin.js';

const attributeDirectory = {
  multiple: MultipleMixin,
  blank: BlankMixin,
  mailto: MailtoMixin,
  tel: TelMixin,
}

export {
  attributeDirectory,
  MultipleMixin,
  BlankMixin,
  MailtoMixin,
  TelMixin,
}
