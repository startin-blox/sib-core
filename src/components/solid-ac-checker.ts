import JSONLDContextParser from 'jsonld-context-parser';
import { Sib } from '../libs/Sib';
import { StoreMixin } from '../mixins/storeMixin';

export const SolidAcChecker = {
  name: 'solid-ac-checker',
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
    if (!this.resource) return;
    let displayElement: boolean;
    const ContextParser = JSONLDContextParser.ContextParser;
    const permissions = await this.resource.permissions;
    if (this.permission) { // User has permission of ...
      displayElement = permissions.some((p:any) => {
        return ContextParser.expandTerm(p, this.context, true) === this.permission;
      });
    } else if (this.noPermission) { // User has no permission of ...
      displayElement = permissions.every((p:any) => {
        return ContextParser.expandTerm(p, this.context, true) !== this.noPermission;
      });
    } else { // No parameter provided
      console.warn('solid-ac-checker: you should define at least one of "permission" or "no-permission" attribute.');
      return;
    }

    if (displayElement) this.element.removeAttribute('hidden');
  },
  empty(): void {
    this.element.setAttribute('hidden', '');
  }
};

Sib.register(SolidAcChecker);