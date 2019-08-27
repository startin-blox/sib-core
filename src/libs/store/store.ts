import './ldpframework.js';

export const base_context = {
  '@vocab': 'http://happy-dev.fr/owl/#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  ldp: 'http://www.w3.org/ns/ldp#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  name: 'rdfs:label',
  acl: 'http://www.w3.org/ns/auth/acl#',
  permissions: 'acl:accessControl',
  mode: 'acl:mode',
  email: 'http://happy-dev.fr/owl/#email',
};

export class Store {
  originalStore: any;

  constructor(options: object) {
    this.originalStore = new (<any>window).MyStore(options);
  }

  async get(id: string, context = {}): Promise<object> {
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


/**
 * LDFLEX WRAPPER
 * ultimately, we need to get rid of this
*/
class LDFlexGetter {
  resourceId: string;
  resource: any;
  context: object;
  proxy: any;

  constructor(resourceId: string, context: object) {
    this.resourceId = resourceId;
    this.context = context;
  }

  async init() { // TODO : Put this in store wrapper ?
    //@ts-ignore
    if(Object.keys(this.context)) await solid.data.context.extend(this.context); // We extend the context with our own...
    //@ts-ignore
    this.resource = solid.data[this.resourceId]; // ... then we get the resource datas
    return this;
  }

  async get(path: any) {
    const path1: string[] = path.split('.');
    const path2: string[] = [];
    let value: any;
    while (true) {
      try {
        value = await this.resource.resolve(path1.join('.'));
      } catch (e) { break }

      if (value !== undefined) break;
      if (path1.length <= 1) return undefined;
      const lastPath1El = path1.pop();
      if(lastPath1El) path2.unshift(lastPath1El);
    }
    if (path2.length === 0) return value; // end of the path
    return new LDFlexGetter(value.toString(), this.context).init().then(res => res.get(path2.join('.')));
  }

  async isContainer() {
    return await this.resource.type == "http://www.w3.org/ns/ldp#Container"; // TODO : get compacted field
  }

  // Returns a Proxy which handles the different get requests
  async getProxy() {
    if (!this.proxy) {
      await this.init();
      this.proxy = new Proxy(this, {
        get: (resource, property) => {
          switch (property) {
            case '@id':
            case 'then':
              return this.resource.toString();
            case 'properties':
            case 'ldp:contains':
            case 'permissions':
              return this.resource[property];
            case 'isContainer':
              return resource.isContainer();
            default:
              return resource.get(property);
          }
        }
      })
    }
    return this.proxy;
  }
}