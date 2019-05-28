import { Sib } from '../libs/Sib.js';
import { StoreMixin } from '../mixins/storeMixin.js';

export const SibAcChecker = {
  name: 'sib-ac-checker',
  use: [StoreMixin],
  attributes: {
    permission: {
      type: String,
      default: "view",
    }
  },
  populate() {
    for (let permission of this.resource['@permissions']) {
      if (permission.mode['@type'] === this.permission) {
        this.element.removeAttribute('hidden');
      }
    }
  },
  empty() {
    this.element.setAttribute('hidden', '');
  }
};

Sib.register(SibAcChecker);