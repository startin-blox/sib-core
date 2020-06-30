import "https://unpkg.com/autolinker/dist/Autolinker.min.js";

const AutolinkMixin = {
  name: 'autolink-mixin',
  created() {
    this.listCallbacks.push(this.addCallback.bind(this));
  },
  addCallback(value: string, listCallbacks: Function[]) {
    //@ts-ignore
    this.element.innerHTML = Autolinker.link(this.element.innerHTML);

    const nextProcessor = listCallbacks.shift();
    if(nextProcessor) nextProcessor(value, listCallbacks);
  }
}

export {
  AutolinkMixin
}