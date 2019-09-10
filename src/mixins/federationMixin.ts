//@ts-ignore
import asyncChain from 'https://dev.jspm.io/iter-tools/es2018/async-chain';
//@ts-ignore
import asyncFilter from 'https://dev.jspm.io/iter-tools/es2018/async-filter';
import { store } from '../libs/store/store.js';

const FederationMixin = {
  name: 'federation-mixin',
  use: [],
  attached(): void {
    this.listPostProcessors.push(this.fetchSources.bind(this));
  },
  async fetchSources(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    for await (let res of resources) { // TODO : test with different response timings
      let type = await res['type'];
      if (type && type.toString() == "http://www.w3.org/ns/ldp#Container") {
        const containerId = res.toString();
        resources = asyncChain(resources, await this.fetchSource(containerId)); // Add content of sources to array...
        resources = asyncFilter(2, resource => resource.toString() != containerId, resources); // ...and remove source from array
      }
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
  },

  async fetchSource(containerId: string): Promise<object> {
    await store.initGraph(containerId);
    const container = store.get(containerId);
    return container['ldp:contains'];
  },
}

export {
  FederationMixin
}