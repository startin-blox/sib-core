import type { PostProcessorRegistry } from '../libs/PostProcessorRegistry.ts';
import { store } from '../libs/store/store.ts';
import type { Resource } from './interfaces.ts';

const FederationMixin = {
  name: 'federation-mixin',
  use: [],
  initialState: {
    containerFetched: null,
  },
  attached(): void {
    this.listPostProcessors.attach(
      this.fetchSources.bind(this),
      'FederationMixin:fetchSources',
    );
  },
  async fetchSources(
    resources: Resource[],
    listPostProcessors: PostProcessorRegistry,
    div: HTMLElement,
    context: string,
  ) {
    this.containerFetched = [];
    let newResources: Resource[] = await this.getResources(resources);
    newResources = [...new Set(newResources)]; // remove possible duplicates

    this.resources = [...newResources]; // Create a new array to avoid unintended reference issues
    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(newResources, listPostProcessors, div, context);
  },
  async getResources(resources: Resource[]): Promise<Resource[]> {
    if (!resources && this.resources) resources = this.resources;
    if (!resources) return [];
    const newResources: Resource[] = [];

    const getChildResources = async (res: Resource) => {
      if (!res) return;
      if (res.isContainer?.()) {
        // if this is a container
        const containerId = res['@id'];
        if (!this.containerFetched.includes(containerId)) {
          // prevent from including twice the same source
          this.containerFetched.push(containerId);

          const resourcesFetched = await this.fetchSource(containerId); // fetch the resources of this container
          if (resourcesFetched) {
            const t = await this.getResources(resourcesFetched);
            newResources.push(...t); // Add content of source to array...}
          }
        }
      } else {
        newResources.push(res); // Or resource directly if not a container
      }
    };

    // Special case for list support, if there is only one item it is serialized as an object, not an array
    if (!Array.isArray(resources)) resources = [resources];
    await Promise.all(resources.map(async res => await getChildResources(res)));
    return newResources;
  },

  async fetchSource(containerId: string): Promise<Resource[] | null> {
    const cachedContainer = await store.get(containerId); // find container in cache
    // if (containerId === "https://ldp-server.test/users/") debugger;
    const c = await cachedContainer?.getContainerList();

    if (!cachedContainer || c === null) {
      // if container not fetched
      // await store.clearCache(containerId); // empty cache
      const container = await store.getData(containerId, this.context, undefined, undefined, true); // and fetch it
      const t = await container?.['listPredicate'];
      return t;

    }
    const container = await store.getData(containerId, this.context); // and fetch it
    const t = await container?.['listPredicate'];
    return t;

  },
};

export { FederationMixin };
