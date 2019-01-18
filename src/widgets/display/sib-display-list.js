import { SIBMultipleWidget } from '../../parents/index.js';

export class SIBDisplayList extends SIBMultipleWidget {
  get parentTag() {
    return 'ul';
  }
  getTemplate(value, index) {
    return `<li name="${this.name}-${index}">${value}</li>`;
  }
}
customElements.define('sib-display-list', SIBDisplayList);
