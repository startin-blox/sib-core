import { StoreMixin } from '../../mixins/storeMixin.js';

const RangeMixin = {
  name: 'range-mixin',
  use: [ StoreMixin ],
  attributes: {
    range: {
      type: String,
      default: '',
      callback: function (value: string) {
        if (value !== this.dataSrc) this.dataSrc = value;
      }
    }
  },
  populate() {
    this.listAttributes['range'] = this.resource ? this.resource['ldp:contains'] : [];
    this.planRender();
  },
  empty() {
    this.listAttributes['range'] = [];
    this.planRender();
  }
}

export {
  RangeMixin
}