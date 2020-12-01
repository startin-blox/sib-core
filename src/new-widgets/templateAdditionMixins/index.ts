import { LabelMixin } from './labelMixin';
import { LabelLastMixin } from './labelLastMixin';
import { AddableMixin } from './addableMixin';

/**
 * DOM Additions
 */
const templateAdditionDirectory = {
  label: LabelMixin,
  labellast: LabelLastMixin,
  addable: AddableMixin,
}

export {
  templateAdditionDirectory,
  LabelMixin,
  LabelLastMixin,
  AddableMixin,
}
