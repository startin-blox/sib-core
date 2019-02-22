import { base_context, store } from '../../store.js';

class Store {
  constructor() {
    this.graph = new Map();
  }

  async get(id, path) {
    let result = this.fromGraph(id);
    if (!result) {
      result = await this.query(id);
    }

    if (!path) {
      return result;
    }

    if (path in result && '@id' in result[path]) {
      return this.get(result[path]['@id']);
    }

    return result[path];
  }

  fromGraph(id) {
    if (this.graph.has(id)) {
      return this.graph.get(id);
    }
    return;
  }

  async query(uri) {
    const result = await store.get(uri, base_context);

    if (result['@type'] === 'ldp:Container') {
      for (let resource of result['ldp:contains']) {
        this.addResource(resource);
      }
      return this.addContainer(result);
    } else {
      return this.addResource(result);
    }
  }

  addContainer(container) {
    const resources = container['ldp:contains'] || [];
    this.graph.set(container['@id'], resources.map((item) => item['@id']));
    return this.graph.get(container['@id']);
  }

  addResource(resource) {
    const mappedResource = Reflect.ownKeys(resource)
      .filter(prop => !prop.startsWith('@'))
      .reduce((object, key) => {
        const value = resource[key];
        object[key] = (value === Object(value)) ? { '@id': value['@id'] } : value;
        return object;
      }, {});
    this.graph.set(resource['@id'], mappedResource);
    return this.graph.get(resource['@id']);
  }
}

const storeInstance = new Store();
export default storeInstance;
