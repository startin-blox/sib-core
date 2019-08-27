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
  async populate(): Promise<void> {
    for await (const permission of this.resource.permissions.mode.type) {
      if (permission.toString() === this.permission) { // TODO : get compacted field
        this.element.removeAttribute('hidden');
      }
    }
  },
  empty(): void {
    this.element.setAttribute('hidden', '');
  }
};

Sib.register(SibAcChecker);