import { store } from '../libs/store/store';
import type { Resource } from './interfaces';

const FederationMixin = {
  name: 'federation-mixin',
  use: [],
  initialState: {
    containerFetched: null
  },
  attached(): void {
    this.listPostProcessors.push(this.fetchSources.bind(this));
  },
  async fetchSources(resources: Resource[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    this.containerFetched = [];
    let newResources: Resource[] = this.getResources(resources);
    newResources = [...new Set(newResources)]; // remove possible duplicates

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(newResources, listPostProcessors, div, context);
  },
  getResources(resources: Resource[]): Resource[] {
    const newResources: Resource[] = [];
    for (let res of resources) { // TODO : test with different response timings
      if (!res) continue;
      if (res.isContainer()) { // if this is a container
        const containerId = res['@id'];
        if (!this.containerFetched.includes(containerId)) { // prevent from including twice the same source
          this.containerFetched.push(containerId);

          const resourcesFetched = this.fetchSource(containerId); // fetch the resources of this container
          if (resourcesFetched) newResources.push(...this.getResources(resourcesFetched)); // Add content of source to array...
        }
      } else {
        newResources.push(res); // Or resource directly if not a container
      }
    }
    return newResources;
  },

  fetchSource(containerId: string): Promise<Resource[] | null> {
    const container = store.get(containerId);
    return container ? container['ldp:contains'] : null;
  },
}

export {
  FederationMixin
}