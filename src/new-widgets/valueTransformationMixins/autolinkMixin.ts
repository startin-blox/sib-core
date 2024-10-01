import {Autolinker} from 'autolinker';

const AutolinkMixin = {
  name: 'autolink-mixin',
  created() {
    this.listValueTransformations.push(this.transformValue.bind(this));
  },
  transformValue(value: string, listValueTransformations: Function[]) {
    const template = document.createElement('template');
    template.innerHTML =  Autolinker.link(value);

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(template.content, listValueTransformations);
  },
};

export { AutolinkMixin };
