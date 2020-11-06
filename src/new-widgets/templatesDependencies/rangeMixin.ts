import { StoreMixin } from '../../mixins/storeMixin';
import { SorterMixin } from '../../mixins/sorterMixin';
import { FederationMixin } from '../../mixins/federationMixin';

const RangeMixin = {
  name: 'range-mixin',
  use: [
    StoreMixin,
    SorterMixin,
    FederationMixin
  ],
  attributes: {
    range: {
      type: String,
      default: '',
      callback: function (value: string) {
        if (value !== this.dataSrc) this.dataSrc = value;
      }
    },
    enum: {
      type: String,
      default: '',
      callback: function (value: string) {
        if (value !== null) {
          const optional = value.trim().split(",");
          let key;
          let keyValue;
          const list = {};
          
          optional.forEach(element => {
            if (element.includes("=")) {              
              const option = element.trim().split("=");
              key = option[1].trim();
              keyValue = option[0].trim();
              list[key] = keyValue;              
            } else {
              const elem = element.trim();
              list[elem] = elem;
            }
          });
          this.addToAttributes(list, 'enum');
        };
      }
    },
    optionLabel: {
      type: String,
      default: 'name',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'optionLabel');
      }
    }
  },
  initialState: {
    listPostProcessors: [],
  },
  created() {
    this.listPostProcessors = [];
    this.listAttributes['optionLabel'] = this.optionLabel;
  },
  async populate() {
    const resources = this.resource ? this.resource['ldp:contains'] : [];
    const listPostProcessors = [...this.listPostProcessors];
    listPostProcessors.push(this.setRangeAttribute.bind(this));

    const nextProcessor = listPostProcessors.shift();
    await nextProcessor(
      resources,
      listPostProcessors,
      null,
      this.dataSrc,
    );
  },
  setRangeAttribute(
    resources: object[]
  ) {
    this.listAttributes['range'] = resources;
    this.planRender();
  },
  empty() {
    this.listAttributes['range'] = [];
    this.planRender();
  },
  get type() {
    return  this.enum !== '' ? 'string' : 'resource';
  }
}

export {
  RangeMixin
}