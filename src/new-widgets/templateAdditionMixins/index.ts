import { AddableMixin } from './addableMixin';
import { LabelLastMixin } from './labelLastMixin';
import { LabelMixin } from './labelMixin';

/**
 * DOM Additions
 */
const templateAdditionDirectory = {
  label: LabelMixin,
  labellast: LabelLastMixin,
  addable: AddableMixin,
};

export { templateAdditionDirectory, LabelMixin, LabelLastMixin, AddableMixin };
