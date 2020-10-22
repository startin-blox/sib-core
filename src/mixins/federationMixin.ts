import { store } from '../libs/store/store.js';
import type { Resource } from './interfaces.js';

const FederationMixin = {
  name: 'federation-mixin',
  use: [],
  attached(): void {
    this.listPostProcessors.push(this.fetchSources.bind(this));
  },
  async fetchSources(resources: Resource[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    let sources: Resource[] = this.getResources(resources);

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(sources, listPostProcessors, div, context);
  },
  getResources(resources: Resource[]): Resource[] {
    const sources: Resource[] = [];
    for (let res of resources) { // TODO : test with different response timings
      if (!res) continue;
      if (res.isContainer()) {
        const containerId = res['@id'];
        const resourcesFetched = this.fetchSource(containerId);
        if (resourcesFetched) {
          sources.push(...this.getResources(resourcesFetched)); // Add content of sources to array...
        }
      } else {
        sources.push(res); // Or resource directly if not a container
      }
    }
    return sources;
  },

  fetchSource(containerId: string): Promise<Resource[]|null> {
    const container = store.get(containerId);
    return container ? container['ldp:contains'] : null;
  },
}

export {
  FederationMixin
}