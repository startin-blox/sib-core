import { Sib } from '../libs/Sib.ts';
import { normalizeContext } from '../libs/helpers.ts';
import { trackRenderAsync } from '../logger.ts';
import { StoreMixin } from '../mixins/storeMixin.ts';

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
    },
  },
  populate: trackRenderAsync(async function (): Promise<void> {
    if (!this.resource) return;
    let displayElement: boolean;
    const permissions = await this.resource.permissions;
    if (this.permission) {
      // User has permission of ...
      displayElement = permissions.some((p: any) => {
        const context = normalizeContext(this.context);
        return context.expandTerm(p, true) === this.permission;
      });
    } else if (this.noPermission) {
      // User has no permission of ...
      displayElement = permissions.every((p: any) => {
        const context = normalizeContext(this.context);
        return context.expandTerm(p, true) !== this.noPermission;
      });
    } else {
      // No parameter provided
      console.warn(
        'solid-ac-checker: you should define at least one of "permission" or "no-permission" attribute.',
      );
      return;
    }

    if (displayElement) this.element.removeAttribute('hidden');
  }, 'SolidAcChecker:populate'),
  empty(): void {
    this.element.setAttribute('hidden', '');
  },
};

Sib.register(SolidAcChecker);
