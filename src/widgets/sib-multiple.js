import { SIBWidget } from '../parents/index.js';

export default class SIBMultiple extends HTMLElement {
  render() {}
  get value(){
    return this.widgets.map(widget => widget.value);
  }
}
customElements.define('sib-multiple', SIBMultiple);
