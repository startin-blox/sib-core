import { SIBWidget } from '../../parents/index.js';

export default class SIBDisplayTel extends SIBWidget {
  get template() {
    return `<a href="tel:${this.value}" name="${this.name}">${this.value}</a>`;
  }
}
customElements.define('sib-display-tel', SIBDisplayTel);
