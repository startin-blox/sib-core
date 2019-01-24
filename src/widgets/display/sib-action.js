import { SIBWidget } from '../../parents/index.js';

export default class SIBAction extends SIBWidget {
  get template() {
    return `
    <sib-link data-src="${this.src}" next="${this.value}">${this.name}</sib-link>
    `;
  }
}
customElements.define('sib-action', SIBAction);
