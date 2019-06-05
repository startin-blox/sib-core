import { SIBBase } from '../parents/index.js';

export default class SIBACChecker extends SIBBase {
  get permission() {
    return this.getAttribute('permission') || 'view';
  }

  populate() {
    for (let permission of this.permissions) {
      if (permission.mode['@type'] === this.permission) {
        this.removeAttribute('hidden');
      }
    }
  }

  empty() {
    this.setAttribute('hidden', '');
  }
}

customElements.define('sib-ac-checker', SIBACChecker);
