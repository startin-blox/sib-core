import './ldpframework.js';
import { loadScript } from '../helpers.js';

const scriptsLoading = Promise.all([
  loadScript('https://solid.github.io/solid-auth-client/dist/solid-auth-client.bundle.js'),
  loadScript('./solid-query-ldflex.bundle.js')
]);

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
  cache: Map<string, any>;
  headers: HeadersInit;

  constructor(options: object) {
    this.cache = new Map();
    this.originalStore = new (<any>window).MyStore(options);
    this.headers = new Headers();
    this.headers.set('Content-Type', 'application/ld+json');
  }

  async initGraph(id: string, context = {}): Promise<void> {
    let hash = '';
    try {
      hash = JSON.stringify(id);
    } catch (e) {}
    if (hash && !this.cache.has(hash)) {
      const getter = await new LDFlexGetter(id, context).getProxy();
      this.cache.set(hash, getter);
    }
  }

  get(id: string): object {
    let hash = '';
    try {
      hash = JSON.stringify(id);
    } catch (e) {}
    return this.cache.get(hash) || null;
  }

  list(id: string) {
    return this.originalStore.list.call(this, id);
  }

  post(resource: object, id: string) {
    return fetch(id, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    });
  }

  put(resource: object, id: string) {
    this.cache.clear();
    return fetch(id, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    });
  }

  patch(id: string, resource: object) {
    return fetch(id, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    });
  }

  async delete(id: string) {
    const deleted = await fetch(id, {
      method: 'DELETE',
      headers: this.headers,
      credentials: 'include'
    });
    this.cache.clear();
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

  async init() {
    await scriptsLoading; // Load solid scripts
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
    if (path2.length === 0) { // end of the path
      switch (value.termType) {
        case "NamedNode": // resource, return proxy
          return await new LDFlexGetter(value.toString(), this.context).getProxy();
        case "Literal": // property, return value
          return value;
        default:
          return undefined
      }
    }
    return new LDFlexGetter(value.toString(), this.context).init().then(res => res.get(path2.join('.')));
  }

  async isContainer() {
    return await this.resource.type == "http://www.w3.org/ns/ldp#Container"; // TODO : get compacted field
  }
  toString() { return this.resource.toString() }
  [Symbol.toPrimitive](){ return this.resource.toString() }

  // Returns a Proxy which handles the different get requests
  async getProxy() {
    if (!this.proxy) {
      await this.init();
      this.proxy = new Proxy(this, {
        get: (resource, property) => {
          if (typeof resource[property] === 'function') return resource[property].bind(resource)

          switch (property) {
            case '@id':
              return this.resource.toString();
            case 'properties':
            case 'ldp:contains':
            case 'permissions':
            case 'type':
              return this.resource[property];
            default:
              return resource.get(property);
          }
        }
      })
    }
    return this.proxy;
  }
}