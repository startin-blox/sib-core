import { SIBWidget } from '../../parents/index.js';

export default class SIBDisplayDiv extends SIBWidget {
  get template() {
    return `<div name="${this.name}">${this.value}</div>`;
  }
}
customElements.define('sib-display-div', SIBDisplayDiv);
