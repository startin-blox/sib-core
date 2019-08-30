const HighlighterMixin = {
  name: 'highlighter-mixin',
  use: [],
  created(): void {
    this.listPostProcessors.push((resources: object[]) => this.hightlightCallback(resources))
  },
  hightlightCallback(resources: object[]): object[] {
    console.log('3. highlight');
    for (let attr of this.element.attributes) {
      if (attr.name.startsWith('highlight-')) {
        const field = attr.name.split('highlight-')[1];
        for (let [index, res] of resources.entries()) {
          if (res[field] && res[field] == attr.value) {
            // put the current element at the beginning of the array
            resources.splice(0, 0, resources.splice(index, 1)[0]);
          }
        }
      }
    }
    return resources
  },
}

export {
  HighlighterMixin
}