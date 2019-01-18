import { SIBWidget } from '../../parents/index.js';

export default class SIBDisplayMailTo extends SIBWidget {
  get template() {
    return `<a href="mailto:${this.value}" name="${this.name}">${
      this.value
    }</a>`;
  }
}
customElements.define('sib-display-mailto', SIBDisplayMailTo);
