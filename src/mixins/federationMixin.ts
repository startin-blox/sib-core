//@ts-ignore
import asyncChain from 'https://dev.jspm.io/iter-tools/es2018/async-chain';
//@ts-ignore
import asyncFilter from 'https://dev.jspm.io/iter-tools/es2018/async-filter';
//@ts-ignore
import asyncToArray from 'https://dev.jspm.io/iter-tools/es2018/async-to-array';
//@ts-ignore
import asyncMap from 'https://dev.jspm.io/iter-tools/es2018/async-map';
import { store } from '../libs/store/store.js';

const FederationMixin = {
  name: 'federation-mixin',
  use: [],
  attached(): void {
    this.listPostProcessors.push(this.fetchSources.bind(this));
  },
  async fetchSources(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    const resourcesCopy = await asyncToArray(resources); // create an array
    for await (let res of resources) { // TODO : test with different response timings
      let type = await res['@type'];
      if (type && type.toString() == "http://www.w3.org/ns/ldp#Container") {
        const containerId = res['@id'];
        resources = asyncChain(resources, await this.fetchSource(containerId)); // Add content of sources to array...
        resources = asyncFilter(2, resource => resource['@id'] != containerId, resources); // ...and remove source from array
      }
    }

    resources = await asyncMap(resource => resource, resourcesCopy); // re-create an iterator

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