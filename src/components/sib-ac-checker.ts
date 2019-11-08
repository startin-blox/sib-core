//@ts-ignore
import asyncSome from 'https://dev.jspm.io/iter-tools/es2018/async-some';
//@ts-ignore
import asyncEvery from 'https://dev.jspm.io/iter-tools/es2018/async-every';
//@ts-ignore
import JSONLDContextParser from 'https://dev.jspm.io/jsonld-context-parser';
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
    const ContextParser = JSONLDContextParser.ContextParser;
    const myParser = new ContextParser();
    const context = await myParser.parse(this.context);

    if (this.permission) { // User has permission of ...
      displayElement = this.resource.permissions.some(p => {
        return ContextParser.compactIri(p.mode['@type'], context) === this.permission;
      });
      /* displayElement = await asyncSome(
        (permission: object) => ContextParser.compactIri(permission.toString(), context) === this.permission,
        this.resource.permissions.mode['@type']
      )*/
    } else if (this.noPermission) { // User has no permission of ...
      displayElement = this.resource.permissions.every(p => {
        return ContextParser.compactIri(p.mode['@type'], context) !== this.permission;
      });
      /*displayElement = await asyncEvery(
        (permission: object) => ContextParser.compactIri(permission.toString(), context) !== this.noPermission,
        this.resource.permissions.mode['@type']
      )*/
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