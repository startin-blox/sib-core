import { StoreMixin } from '../../mixins/storeMixin';

const MultipleselectFormMixin = {
  name: 'multipleselect-form-mixin',
  use: [ StoreMixin ],
  attributes: {
    range: { // range attribute is passed to the solid-dropdown
      type: String,
      default: '',
      callback: function(value) {
        if (value && value !== this.listAttributes['range']) this.listAttributes['range'] = value;
      }
    },
    enum: { // enum attribute is passed to the solid-dropdown
      type: String,
      default: '',
      callback: function (value) {
        if (value && value !== this.listAttributes['enum']) this.listAttributes['enum'] = value;
      }
    },
    orderAsc: {
      type: String,
      default: 'name',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'orderAsc');
      }
    },
    orderDesc: {
      type: String,
      default: 'name',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'orderDesc');
      }
    }
  },
  created() {
    this.listValueTransformations.push(this.setDataSrc.bind(this));
  },
  setDataSrc(value: string, listValueTransformations: Function[]) {
    if (value && value !== this.dataSrc) this.dataSrc = value;

    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(value, listValueTransformations);
  },
  populate() {
    if (!this.resource || !this.resource['ldp:contains']) return;
    this.setValue(this.resource['ldp:contains']);
    this.planRender();
  },
  setValue(values: string[]) { // set the values to the dropdown
    this.listAttributes['values'] = JSON.stringify(values.map(r => r['@id']));
  },
  empty() {
    this.listAttributes['values'] = [];
    this.planRender();
  },
  get type() {
    return this.enum === '' ? 'resource' : 'string';
  },
  get multiple() {
    return true;
  },
}

export {
  MultipleselectFormMixin
}