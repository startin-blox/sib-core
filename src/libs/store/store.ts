//@ts-ignore
import JSONLDContextParser from 'https://dev.jspm.io/jsonld-context-parser';
//@ts-ignore
import asyncMap from 'https://dev.jspm.io/iter-tools/es2018/async-map';
import { loadScript } from '../helpers.js';

const scriptsLoading = (async () => {
  await loadScript('https://solid.github.io/solid-auth-client/dist/solid-auth-client.bundle.js');
  await loadScript('./solid-query-ldflex.bundle.js');
})();

const ContextParser = JSONLDContextParser.ContextParser;
const myParser = new ContextParser();

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
  email: 'http://happy-dev.fr/owl/#email', // TODO : workaround for https://github.com/solid/query-ldflex/issues/36
  firstName: 'http://happy-dev.fr/owl/#first_name', // TODO : workaround for https://github.com/solid/query-ldflex/issues/38
  lastName: 'http://happy-dev.fr/owl/#last_name', // TODO : workaround for https://github.com/solid/query-ldflex/issues/38
  type: 'http://happy-dev.fr/owl/#type',  // TODO : remove when https://github.com/solid/query-ldflex/issues/41 fixed
};

export class Store {
  cache: Map<string, any>;
  headers: HeadersInit;

  constructor() {
    this.cache = new Map();
    this.headers = new Headers();
    this.headers.set('Content-Type', 'application/ld+json');
  }

  async initGraph(id: string, context = {}): Promise<void> {
    if (!this.cache.has(id)) {
      const getter = await new LDFlexGetter(id, context).getProxy();
      this.cache.set(id, getter);

      if (await getter.isContainer()) { // if resource is a container, cache the children
        for await (const resource of getter['ldp:contains']) {
          let resourceId = resource.toString();
          if (this.cache.has(resourceId) || resourceId.match(/^b\d+$/)) continue;
          this.cache.set(resourceId, resource);
        }
      }
    }
  }

  get(id: string): object {
    return this.cache.get(id) || null;
  }

  post(resource: object, id: string): Promise<string | null> {
    return fetch(this._getExpandedId(id, resource['@context']), {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    }).then(response => response.headers.get('Location') || null);
  }

  put(resource: object, id: string): Promise<string | null> {
    return fetch(this._getExpandedId(id, resource['@context']), {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    }).then(response => response.headers.get('Location') || null);
  }

  patch(resource: object, id: string): Promise<string | null> {
    return fetch(this._getExpandedId(id, resource['@context']), {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    }).then(response => response.headers.get('Location') || null);
  }

  async delete(id: string, context: object = {}) {
    const deleted = await fetch(this._getExpandedId(id, context), {
      method: 'DELETE',
      headers: this.headers,
      credentials: 'include'
    });
    return deleted;
  }

  _getExpandedId(id: string, context: object) {
    return (context && Object.keys(context)) ? ContextParser.expandTerm(id, context) : id;
  }
}

export const store = new Store();

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

  async init(proxy = null) {
    await scriptsLoading; // Load solid scripts
    if (Object.keys(this.context)) await solid.data.context.extend(this.context); // We extend the context with our own...

    this.context = await myParser.parse(this.context);
    let iri = ContextParser.expandTerm(this.resourceId, this.context); // expand if reduced ids
    iri = new URL(iri, document.location.href).href; // and get full URL for local files
    this.resource = proxy || solid.data[iri]; // ... then we get the resource datas
    return this;
  }

  async get(path: any) {
    const path1: string[] = path.split('.');
    const path2: string[] = [];
    let value: any;
    while (true) {
      try {
        value = await this.resource.resolve(`["${path1.join('.')}"]`); // TODO: remove when https://github.com/solid/query-ldflex/issues/40 fixed
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
    const type = await this.resource['rdf:type'];
    if (!type) return false;
    return this.getCompactedIri(type.toString()) == "ldp:Container"; // TODO : ldflex should return compacted field
  }

  async clearCache() {
    await solid.data.clearCache(this.resourceId);
  }

  getCompactedIri(id: string) { return ContextParser.compactIri(id, this.context) }
  toString() { return this.getCompactedIri(this.resource.toString()) }
  [Symbol.toPrimitive]() { return this.getCompactedIri(this.resource.toString()) }

  getAsyncIterable(property: string) {
    return asyncMap(
      resource => new LDFlexGetter(resource.toString(), this.context).getProxy(resource),
      this.resource[property]
    );
  }

  // TODO : remove when https://github.com/solid/query-ldflex/issues/39 fixed
  getProperties() {
    return asyncMap(
      (prop: string) => ContextParser.compactIri(prop, this.context, true),
      this.resource.properties
    );
  }

  async getType() {
    const type = await this.resource['rdf:type'];
    return type ? this.getCompactedIri(type.toString()) : undefined;
  }

  // Returns a Proxy which handles the different get requests
  async getProxy(proxy = null) {
    if (!this.proxy) {
      await this.init(proxy);
      this.proxy = new Proxy(this, {
        get: (resource, property) => {
          if (typeof resource[property] === 'function') return resource[property].bind(resource)

          switch (property) {
            case '@id':
              return this.getCompactedIri(this.resource.toString()); // Compact @id if possible
            case '@type':
              return this.getType(); // TODO : remove when https://github.com/solid/query-ldflex/issues/41 fixed
            case 'properties':
              return this.getProperties();
            case 'permissions':
            case 'termType':
            case 'subjects':
            case 'predicates':
              return this.resource[property]
            case 'ldp:contains':
              return this.getAsyncIterable(property);
            case 'then':
              return;
            default:
              return resource.get(property);
          }
        }
      })
    }
    return this.proxy;
  }
}