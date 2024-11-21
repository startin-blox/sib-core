import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry';
import { StoreMixin } from '../../mixins/storeMixin';

const MultipleselectFormMixin = {
  name: 'multipleselect-form-mixin',
  use: [StoreMixin],
  attributes: {
    range: {
      // range attribute is passed to the solid-dropdown
      type: String,
      default: '',
      callback: function (value) {
        if (value && value !== this.listAttributes.range)
          this.listAttributes.range = value;
      },
    },
    enum: {
      // enum attribute is passed to the solid-dropdown
      type: String,
      default: '',
      callback: function (value) {
        if (value && value !== this.listAttributes.enum)
          this.listAttributes.enum = value;
      },
    },
    orderAsc: {
      type: String,
      default: 'name',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'orderAsc');
      },
    },
    orderDesc: {
      type: String,
      default: 'name',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'orderDesc');
      },
    },
  },
  created() {
    this.listValueTransformations.attach(
      this.setDataSrc.bind(this),
      'MultipleselectFormMixin:setDataSrc',
    );
  },
  setDataSrc(value: string, listValueTransformations: PostProcessorRegistry) {
    if (value && value !== this.dataSrc) {
      try {
        const values = JSON.parse(value);
        if (values && Array.isArray(values)) {
          this.setValue(values);
        } else {
          this.setValue([value]);
        }
      } catch (ex) {
        this.dataSrc = value;
        this.setValue([{ '@id': value }]);
      }
    }

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(value, listValueTransformations);
  },
  populate() {
    if (
      !this.resource ||
      (!this.resource['ldp:contains'] && !Array.isArray(this.resource))
    )
      return;
    this.setValue(this.resource['ldp:contains']);

    // TODO: Rationalize or clean this commented code
    // console.log("Populate of multipleselectformmixin", this.dataSrc, this.resource, this.resourceId, this.resource['ldp:contains'])
    // if (this.resource['ldp:contains']) this.setValue(this.resource['ldp:contains']);
    // else if(!Array.isArray(this.resource)) this.setValue(this.resource)

    this.planRender();
  },
  setValue(values: string[]) {
    // set the values to the dropdown
    this.listAttributes.values = JSON.stringify(values.map(r => r['@id']));
  },
  empty() {
    this.listAttributes.values = [];
    this.planRender();
  },
  get type() {
    return this.enum === '' ? 'resource' : 'string';
  },
  get multiple() {
    return true;
  },
};

export { MultipleselectFormMixin };
