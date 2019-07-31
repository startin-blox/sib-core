import { Sib } from '../libs/Sib.js';
import { PermissionInterface } from '../libs/interfaces.js';
import { StoreMixin } from '../mixins/storeMixin.js';

export const SibAcChecker = {
  name: 'sib-ac-checker',
  use: [StoreMixin],
  attributes: {
    permission: {
      type: String,
      default: '',
    },
    noPermission: {
      type: String,
      default: '',
    }
  },
  populate(): void {
    let displayElement: boolean;

    if (this.permission) { // User has permission of ...
      displayElement = this.permissions.some((permission: PermissionInterface) => permission.mode['@type'] === this.permission)
    } else if (this.noPermission) { // User has no permission of ...
      displayElement = this.permissions.every((permission: PermissionInterface) => permission.mode['@type'] !== this.permission)
    } else { // No parameter provided
      console.warn('sib-ac-checker: you should define at least one of "permission" or "no-permission" attribute.');
      return;
    }

    if (displayElement) this.element.removeAttribute('hidden');
  },
  empty(): void {
    this.element.setAttribute('hidden', '');
  }
};

Sib.register(SibAcChecker);