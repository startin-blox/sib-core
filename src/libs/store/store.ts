import './ldpframework.js';

export const base_context = {
  '@vocab': 'http://happy-dev.fr/owl/#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  ldp: 'http://www.w3.org/ns/ldp#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  name: 'rdfs:label',
  acl: 'http://www.w3.org/ns/auth/acl#',
  '@permissions': 'acl:accessControl',
  mode: 'acl:mode',
};

export class Store {
  cache: Map<string, any>;
  originalStore: any;

  constructor(options: object) {
    this.cache = new Map();
    this.originalStore = new (<any>window).MyStore(options);
  }

  get(id: string, context = null, force = false, page = null, offset = null): Promise<object> {
    let hash = '';
    try {
      hash = JSON.stringify([id, context]);
    } catch (e) {}
    if (hash && !this.cache.has(hash) || force) {
            const get = this.originalStore.get(Store.paginatedUrl(id, page, offset), context);
      this.cache.set(hash, get);
      get.catch(error => {
        console.error('store.get() Error: ', id);
        throw error;
      });
    }
    return this.cache.get(hash);
  }

  list(id: string) {
    return this.originalStore.list.call(this, id);
  }

  save(resource: object, id: string) {
    this.cache.clear();
    return this.originalStore.save(resource, id);
  }

  patch(id: string, resource: object) {
    this.cache.clear();
    return this.originalStore.patch(id, resource);
  }

  async delete(id: string) {
    let deleted = await this.originalStore.delete(id);
    this.cache.clear();
    return deleted;
  }

  static paginatedUrl(id: string, page, offset) {
    let url =  new URL(id);
    let searchParams = url.searchParams;
    if(page) {
      searchParams.set('page', page)
    }
    if(offset) {
      searchParams.set('offset', offset)
    }
    return url.toString();
  }
}

export const store = new Store({
  context: base_context,
  defaultSerializer: 'application/ld+json',
});
