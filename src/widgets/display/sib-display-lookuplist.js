import { SIBMultipleWidget } from '../../parents/index.js';
import { store } from '../../store.js';

export class SIBDisplayLookupList extends SIBDisplayList {
  getTemplate(value, index) {
    if (typeof value == 'object' && !('ldp:contains' in value)) {
      if (value.name) value = value.name;
      else {
        store.get(value).then(resource => {
          if(!resource.name) return;
          this.value.push(resource);
          this.render();
        });
        if (Array.isArray(this.value))
          this.value.splice(this.value.indexOf(value), 1);
        else this.value = [];
        return '';
      }
    }
    return super.getTemplate(value, index);
  }
}
customElements.define('sib-display-lookuplist', SIBDisplayLookupList);
