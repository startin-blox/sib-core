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
  populate(): void {
    for (let permission of this.permissions) {
      if (permission.mode['@type'] === this.permission) {
        this.element.removeAttribute('hidden');
      }
    }
  },
  empty(): void {
    this.element.setAttribute('hidden', '');
  }
};

Sib.register(SibAcChecker);