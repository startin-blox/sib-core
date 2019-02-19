import { SIBBase } from '../parents/index.js';

export default class SIBACChecker extends SIBBase {
  // eslint-disable-next-line class-methods-use-this
  get extraContext() {
    return {
      acl: 'http://www.w3.org/ns/auth/acl#',
      permissions: 'acl:accessControl',
      mode: 'acl:mode',
    };
  }

  get permission() {
    return this.getAttribute('permission') || 'view';
  }

  populate() {
    this.resource.permissions.forEach((permission) => {
      if (permission.mode['@type'] === this.permission) {
        this.removeAttribute('hidden');
      }
    });
  }

  empty() {
    this.setAttribute('hidden', '');
  }
}

customElements.define('sib-ac-checker', SIBACChecker);
