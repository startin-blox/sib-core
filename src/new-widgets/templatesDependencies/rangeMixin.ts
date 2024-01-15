import { base_context, store } from '../../libs/store/store';
import { StoreMixin } from '../../mixins/storeMixin';
import { SorterMixin } from '../../mixins/sorterMixin';
import { FederationMixin } from '../../mixins/federationMixin';
import type { Resource } from '../../mixins/interfaces';

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
    },
    optionValue: {
      type: String,
      default: '@id',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'optionValue');
      }
    }
  },
  initialState: {
    listPostProcessors: [],
  },
  created() {
    this.listPostProcessors = [];
    this.listAttributes['optionLabel'] = this.optionLabel;
    this.listAttributes['optionValue'] = this.optionValue;
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
  async setRangeAttribute(
    resources: Resource[]
  ) {
    if (resources) {
      // process resources to create the template
      const getRangeValue = async (resource: Resource) => {
        let res = await store.getData(resource['@id'], this.context || base_context, undefined, undefined, true);
        //TODO: handle properly the fact that the res could be null
        if (res === null) {
          res = resource;
        }

        //TODO: this splitting and expanding is disgusting, please find another solution !!
        let valuePredicate = store.getExpandedPredicate(this.optionValue.split(/[.]+/)[0], this.context || base_context);
        const selectedValue = await res[valuePredicate]; // value used for selected options
        let value = '';
        if (this.optionValue.includes('@id') && !selectedValue['@id']) // value of the option
            value = `{"@id": "${selectedValue}"}` //  resource
        else if (typeof selectedValue === 'object' && selectedValue['@id'])
          value = `{"@id": "${selectedValue['@id']}"}` //  resource
        else
          value = selectedValue; // literal

        //TODO: this splitting and expanding is disgusting, please find another solution !!
        let labelPredicate = store.getExpandedPredicate(this.optionLabel.split(/[.]+/).pop(), this.context || base_context);
        const label = await res[labelPredicate]; // label of the option
        return { value, label, selectedValue }
      }

      this.listAttributes['range'] = await Promise.all(
        resources.filter(el => el !== null).map(r => getRangeValue(r))
      );
    }

    this.planRender();
  },
  empty() {
    this.listAttributes['range'] = [];
    this.planRender();
  },
  get type() {
    return  this.enum === ''? 'resource' : 'string';
  }
}

export {
  RangeMixin
}