//@ts-ignore
import asyncChain from 'https://dev.jspm.io/iter-tools@6/es2018/async-chain';
//@ts-ignore
import asyncFilter from 'https://dev.jspm.io/iter-tools@6/es2018/async-filter';
//@ts-ignore
import asyncToArray from 'https://dev.jspm.io/iter-tools@6/es2018/async-to-array';
//@ts-ignore
import asyncMap from 'https://dev.jspm.io/iter-tools@6/es2018/async-map';
import { store } from '../libs/store/store.js';

const FederationMixin = {
  name: 'federation-mixin',
  use: [],
  attached(): void {
    this.listPostProcessors.push(this.fetchSources.bind(this));
  },
  async fetchSources(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    let sources: any[] = [];
    for (let res of resources) { // TODO : test with different response timings
      if (!res) continue;
      let type = await res['@type'];
      if (type && type.toString() == "ldp:Container") {
        const containerId = res['@id'];
        const resourcesFetched = this.fetchSource(containerId);
        if (resourcesFetched) sources.push(...resourcesFetched); // Add content of sources to array...
      } else {
        sources.push(res); // Or resource directly if not a container
      }
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(sources, listPostProcessors, div, context);
  },

  fetchSource(containerId: string): Promise<object> {
    const container = store.get(containerId);
    return container ? container['ldp:contains'] : null;
  },
}

export {
  FederationMixin
}