import { SIBMultipleWidget } from '../../parents/index.js';

export default class SIBDisplayList extends SIBMultipleWidget {
  // eslint-disable-next-line class-methods-use-this
  get parentTag() {
    return 'ul';
  }

  getTemplate(value, index) {
    return `<li name="${this.name}-${index}">${value}</li>`;
  }
}
customElements.define('sib-display-list', SIBDisplayList);
