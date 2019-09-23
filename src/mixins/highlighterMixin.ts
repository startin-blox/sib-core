//@ts-ignore
import asyncMap from 'https://dev.jspm.io/iter-tools/es2018/async-map';
//@ts-ignore
import asyncToArray from 'https://dev.jspm.io/iter-tools/es2018/async-to-array';

const HighlighterMixin = {
  name: 'highlighter-mixin',
  use: [],
  attached(): void {
    this.listPostProcessors.push(this.hightlightCallback.bind(this));
  },
  async hightlightCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string): Promise<void> {
    for (let attr of this.element.attributes) {
      if (attr.name.startsWith('highlight-')) {
        const field = attr.name.split('highlight-')[1];
        resources = await asyncMap(async (resource) => ({
          sortingKey: (await resource[field]).toString(), // fetch sorting value
          proxy: resource // and keep proxy
        }), resources);
        resources = await asyncToArray(resources); // tranform in array
        resources = this.sortHighlighted(resources, "sortingKey", attr.value); // highlight element
        resources = await asyncMap(resource => resource.proxy, resources); // and re-transform in async iterator
      }
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
  },

  sortHighlighted(resources, field, value) {
    for (let [index, res] of resources.entries()) {
      if (res[field] && res[field] == value) {
        // put the current element at the beginning of the array
        resources.splice(0, 0, resources.splice(index, 1)[0]); // TODO : test with sort
      }
    }
    return resources
  }
}

export {
  HighlighterMixin
}