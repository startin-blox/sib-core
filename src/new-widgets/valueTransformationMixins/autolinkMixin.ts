import {Autolinker} from 'autolinker';
import { PostProcessorRegistry } from '../../libs/PostProcessorRegistry';

const AutolinkMixin = {
  name: 'autolink-mixin',
  created() {
    this.listValueTransformations.attach(this.transformValue.bind(this), "AutolinkMixin:transformValue");
  },
  transformValue(value: string, listValueTransformations: PostProcessorRegistry) {
    const template = document.createElement('template');
    template.innerHTML =  Autolinker.link(value);

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(template.content, listValueTransformations);
  },
};

export { AutolinkMixin };
