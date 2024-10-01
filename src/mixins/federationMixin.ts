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
    let newResources: Resource[] = await this.getResources(resources);
    newResources = [...new Set(newResources)]; // remove possible duplicates

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(newResources, listPostProcessors, div, context);
  },
  async getResources(resources: Resource[]): Promise<Resource[]> {
    if (!resources) return [];
    const newResources: Resource[] = [];

    const getChildResources = async (res: Resource) => {
      if (!res) return;
      if (res.isContainer?.()) { // if this is a container
        const containerId = res['@id'];
        if (!this.containerFetched.includes(containerId)) { // prevent from including twice the same source
          this.containerFetched.push(containerId);

          const resourcesFetched = await this.fetchSource(containerId); // fetch the resources of this container
          if (resourcesFetched) newResources.push(...(await this.getResources(resourcesFetched))); // Add content of source to array...
        }
      } else {
        newResources.push(res); // Or resource directly if not a container
      }
    }

    // Special case for list support, if there is only one item it is serialized as an object, not an array
    if (!Array.isArray(resources)) resources = [resources];
    await Promise.all(resources.map(res => getChildResources(res)));
    return newResources;
  },

  async fetchSource(containerId: string): Promise<Resource[] | null> {
    const cachedContainer = store.get(containerId); // find container in cache
    if (!cachedContainer || cachedContainer['ldp:contains'] === null) { // if container not fetched
      store.clearCache(containerId); // empty cache
    }
    const container = await store.getData(containerId, this.context); // and fetch it
    return container ? container['ldp:contains'] : null;
  },
}

export {
  FederationMixin
}