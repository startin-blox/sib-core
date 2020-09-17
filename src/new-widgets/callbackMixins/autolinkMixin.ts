import {Autolinker} from 'autolinker';

const AutolinkMixin = {
  name: 'autolink-mixin',
  created() {
    this.listCallbacks.push(this.addCallback.bind(this));
  },
  addCallback(value: string, listCallbacks: Function[]) {
    this.element.innerHTML = Autolinker.link(this.element.innerHTML);

    const nextProcessor = listCallbacks.shift();
    if (nextProcessor) nextProcessor(value, listCallbacks);
  },
};

export { AutolinkMixin };
