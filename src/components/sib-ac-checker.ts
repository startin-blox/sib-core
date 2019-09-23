//@ts-ignore
import asyncSome from 'https://dev.jspm.io/iter-tools/es2018/async-some';
//@ts-ignore
import asyncEvery from 'https://dev.jspm.io/iter-tools/es2018/async-every';
import { Sib } from '../libs/Sib.js';
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

  async populate(): Promise<void> {
    let displayElement: boolean;

    if (this.permission) { // User has permission of ...
      displayElement = await asyncSome((permission: object) => permission.toString() === this.permission, this.resource.permissions.mode.type)
    } else if (this.noPermission) { // User has no permission of ...
      displayElement = await asyncEvery((permission: object) => permission.toString() !== this.permission, this.resource.permissions.mode.type)
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