import { AddableMixin } from './addableMixin.ts';
import { LabelLastMixin } from './labelLastMixin.ts';
import { LabelMixin } from './labelMixin.ts';

/**
 * DOM Additions
 */
const templateAdditionDirectory = {
  label: LabelMixin,
  labellast: LabelLastMixin,
  addable: AddableMixin,
};

export { templateAdditionDirectory, LabelMixin, LabelLastMixin, AddableMixin };
