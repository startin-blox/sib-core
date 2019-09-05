import { store } from '../libs/store/store.js';

const FederationMixin = {
  name: 'federation-mixin',
  use: [],
  created(): void {
    this.listPostProcessors.push(this.fetchSources.bind(this));
  },
  fetchSources(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string): void {
    // var i = resources.length + 1
    // while (i--) {
    //   this.fetchSource(resources[i]['container']); // fetch source
    //   if (resources[i]['type'] == "sib:source") resources.splice(i, 1); // remove from array
    // }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) nextProcessor(resources, listPostProcessors, div, context);
  },

  async fetchSource(containerId: string): Promise<object> { // TODO : fix here
    await store.initGraph(containerId);
    let container = store.get(containerId);
    for await (let res of container['ldp:contains']) {
      console.log(res.toString())
      // TODO : add to array and update DOM
    }
    return {}
  },
}

export {
  FederationMixin
}