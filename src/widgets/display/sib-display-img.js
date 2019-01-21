import { SIBWidget } from '../../parents/index.js';

export default class SIBDisplayImg extends SIBWidget {
  get template() {
    return `<img
      name="${this.name}"
      src="${this.value}"
      style="max-width: 100%; max-height: 100%;"
    />`;
  }
}
customElements.define('sib-display-img', SIBDisplayImg);
