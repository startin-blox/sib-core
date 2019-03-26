import './legacy/ldpframework.js';

export const base_context = {
  '@vocab': 'http://happy-dev.fr/owl/#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  ldp: 'http://www.w3.org/ns/ldp#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  name: 'rdfs:label',
};

export class Store {
  constructor(options) {
    this.cache = new Map();
    this.originalStore = new window.MyStore(options);
  }

  get(id, context) {
    if (context) return this.originalStore.get(id, context);
    if (!this.cache.has(id)) {
      this.cache.set(id, this.originalStore.get(id));
    }
    return this.cache.get(id);
  }

  list(id) {
    return this.originalStore.list.call(this, id);
  }

  save(resource, id) {
    this.cache.clear();
    return this.originalStore.save(resource, id);
  }
}

export const store = new Store({
  context: base_context,
  defaultSerializer: 'application/ld+json',
});
