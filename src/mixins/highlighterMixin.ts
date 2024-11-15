import { PostProcessorRegistry } from '../libs/PostProcessorRegistry';

const HighlighterMixin = {
  name: 'highlighter-mixin',
  use: [],
  attached(): void {
    this.listPostProcessors.attach(
      this.hightlightCallback.bind(this),
      'HighlighterMixin:hightlightCallback',
    );
  },
  async hightlightCallback(
    resources: object[],
    listPostProcessors: PostProcessorRegistry,
    div: HTMLElement,
    context: string,
  ): Promise<void> {
    for (let attr of this.element.attributes) {
      if (attr.name.startsWith('highlight-')) {
        const field = attr.name.split('highlight-')[1];
        resources = await Promise.all(
          resources.map(async resource => ({
            sortingKey: await resource[field], // fetch sorting value
            proxy: resource, // and keep proxy
          })),
        );
        resources = this.sortHighlighted(resources, 'sortingKey', attr.value); // highlight element
        resources = resources.map(resource => (<any>resource).proxy); // and re-transform in arra of resources
      }
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(resources, listPostProcessors, div, context);
  },

  sortHighlighted(resources, field, value) {
    for (let [index, res] of resources.entries()) {
      if (res[field] && res[field] == value) {
        // put the current element at the beginning of the array
        resources.splice(0, 0, resources.splice(index, 1)[0]); // TODO : test with sort
      }
    }
    return resources;
  },
};

export { HighlighterMixin };
