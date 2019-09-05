const HighlighterMixin = {
  name: 'highlighter-mixin',
  use: [],
  attached(): void {
    this.listPostProcessors.push(this.hightlightCallback.bind(this));
  },
  hightlightCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string): void {
    for (let attr of this.element.attributes) {
      if (attr.name.startsWith('highlight-')) {
        const field = attr.name.split('highlight-')[1];
        for (let [index, res] of resources.entries()) {
          if (res[field] && res[field] == attr.value) {
            // put the current element at the beginning of the array
            resources.splice(0, 0, resources.splice(index, 1)[0]); // TODO : test with sort
          }
        }
      }
    }
    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) nextProcessor(resources, listPostProcessors, div, context);
  },
}

export {
  HighlighterMixin
}