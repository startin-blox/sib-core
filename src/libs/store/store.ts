import './ldpframework.js';
import LDFlexGetter from '../../../sib-store/LDFlexGetter.js';

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
  email: 'http://happy-dev.fr/owl/#email',
};

export class Store {
  originalStore: any;

  constructor(options: object) {
    this.originalStore = new (<any>window).MyStore(options);
  }

  async get(id: string, context = null): Promise<object> {
    return await new LDFlexGetter(id, context).getProxy();
  }

  list(id: string) {
    return this.originalStore.list.call(this, id);
  }

  save(resource: object, id: string) {
    return this.originalStore.save(resource, id);
  }

  patch(id: string, resource: object) {
    return this.originalStore.patch(id, resource);
  }

  async delete(id: string) {
    let deleted = await this.originalStore.delete(id);
    return deleted;
  }
}

export const store = new Store({
  context: base_context,
  defaultSerializer: 'application/ld+json',
});
