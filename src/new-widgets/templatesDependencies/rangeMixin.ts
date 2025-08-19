import { PostProcessorRegistry } from '../../libs/PostProcessorRegistry.ts';
import { base_context } from '../../libs/store/impl/ldp/LdpStore.ts';
import type { Resource } from '../../libs/store/shared/types.ts';
import { StoreService } from '../../libs/store/storeService.ts';
import { FederationMixin } from '../../mixins/federationMixin.ts';
import { SorterMixin } from '../../mixins/sorterMixin.ts';
import { StoreMixin } from '../../mixins/storeMixin.ts';

const store = StoreService.getInstance();
const RangeMixin = {
  name: 'range-mixin',
  use: [StoreMixin, SorterMixin, FederationMixin],
  attributes: {
    range: {
      type: String,
      default: '',
      callback: function (value: string) {
        if (value !== this.dataSrc) this.dataSrc = value;
      },
    },
    enum: {
      type: String,
      default: '',
      callback: function (value: string) {
        if (value !== null) {
          const optional = value.trim().split(',');
          const list = {};

          for (const element of optional) {
            if (element.includes('=')) {
              const option = element.trim().split('=');
              const key = option[1].trim();
              const keyValue = option[0].trim();
              list[key] = keyValue;
            } else {
              const elem = element.trim();
              list[elem] = elem;
            }
          }
          this.addToAttributes(list, 'enum');
        }
      },
    },
    optionLabel: {
      type: String,
      default: 'name',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'optionLabel');
      },
    },
    optionValue: {
      type: String,
      default: '@id',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'optionValue');
      },
    },
  },
  initialState: {
    listPostProcessors: new PostProcessorRegistry(),
  },
  created() {
    this.listPostProcessors = new PostProcessorRegistry();
    this.listAttributes.optionLabel = this.optionLabel;
    this.listAttributes.optionValue = this.optionValue;
  },
  async populate() {
    const resources = this.resource ? await this.resource['listPredicate'] : [];
    const listPostProcessorsCopy = this.listPostProcessors.deepCopy();
    listPostProcessorsCopy.attach(
      this.setRangeAttribute.bind(this),
      'RangeMixin:setRangeAttribute',
    );

    const nextProcessor = listPostProcessorsCopy.shift();
    await nextProcessor(resources, listPostProcessorsCopy, null, this.dataSrc);
  },
  async setRangeAttribute(resources: Resource[]) {
    if (resources) {
      // process resources to create the template
      const getRangeValue = async (resource: Resource) => {
        let res = await store.getData(
          resource['@id'],
          this.context || base_context,
        );
        //TODO: handle properly the fact that the res could be null
        if (res === null) {
          res = resource;
        }

        //TODO: this splitting and expanding is disgusting, please find another solution !!
        const selectedValue = await resource[this.optionValue]; // value used for selected options
        const value =
          this.optionValue.includes('@id') || selectedValue['@id']
            ? `{"@id": "${selectedValue}"}`
            : //  resource
              selectedValue; // literal

        //TODO: this splitting and expanding is disgusting, please find another solution !!
        const labelProperty = this.optionLabel.split(/[.]+/).pop();
        const label = await res[labelProperty]; // label of the option
        return { value, label, selectedValue };
      };

      this.listAttributes.range = await Promise.all(
        resources
          .filter(el => el !== null)
          .map(async r => await getRangeValue(r)),
      );
    }

    this.planRender();
  },
  empty() {
    this.listAttributes.range = [];
    this.planRender();
  },
  get type() {
    return this.enum === '' ? 'resource' : 'string';
  },
};

export { RangeMixin };
