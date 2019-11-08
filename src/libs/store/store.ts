//@ts-ignore
import JSONLDContextParser from 'https://dev.jspm.io/jsonld-context-parser';
/*
//@ts-ignore
import asyncMap from 'https://dev.jspm.io/iter-tools/es2018/async-map';
import { loadScript } from '../helpers.js';

const scriptsLoading = (async () => {
  await loadScript('https://solid.github.io/solid-auth-client/dist/solid-auth-client.bundle.js');
  await loadScript('./solid-query-ldflex.bundle.js');
})();
*/

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

  async initGraph(id: string, context = {}, idParent = "") {
    if (!this.cache.has(id)) {
      const getter = await new CustomGetter(id, context, {}, idParent).getProxy();
      await this.cacheGraph(id, getter, context, getter['@context'], idParent || id);
    }
  }

  async cacheGraph(key: string, resource: any, context: object, parentContext: object, parentId: string) {
    if (resource.properties) { // if proxy, cache it
      this.cache.set(key, resource);
    }

    if (resource['@type'] == "ldp:Container") { // if it has children, cache them
      for (let res of resource.getChildren()) {
        await this.cacheGraph(res['@id'], res, context, parentContext, parentId)
      }
      return;
    }

    if (resource['@id'] && !resource.properties) { // if resource
      if (
        this.cache.has(resource['@id']) || // not already in cache
        resource['@id'].match(/^b\d+$/) // and not anonymous node
      ) return;

      const resourceProxy = await new CustomGetter(resource['@id'], context, parentContext, parentId).getProxy(resource);
      this.cache.set(key, resourceProxy);

      // TODO : cache sub objects
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


class CustomGetter {
  resourceId: string;
  resource: any;
  clientContext: object;
  serverContext: object;
  parentId: string
  iri: string;

  constructor(resourceId: string, clientContext: object, serverContext: object = {}, parentId: string = "") {
    this.resourceId = resourceId;
    this.clientContext = clientContext;
    this.serverContext = serverContext;
    this.resource = null;
    this.parentId = parentId;
    this.iri = "";
  }

  /**
   * Fetch datas if needed and expand all properties
   * @param data : object - content of the resource if already loaded
   */
  async init(data: object | null = null) {
    this.clientContext = await myParser.parse(this.clientContext);
    this.iri = this.getAbsoluteIri(this.resourceId, this.clientContext, this.parentId);

    // Fetch datas if needed
    if (data && Object.keys(data).length == 1) { data = null } // if only @id in resource, fetch it
    let resource;
    try {
      resource = data || await fetch(this.iri, {
        method: 'GET',
        credentials: 'include'
      }).then(response => {
        if (response.status !== 200) return;
        return response.json()
      })
    } catch (e) { }
    if (!resource) return

    this.serverContext = await myParser.parse([this.serverContext, resource['@context'] || {}]);

    // Expand properties
    resource = await this.expandProperties({ ...resource }, this.serverContext);
    this.resource = resource;

    return this;
  }

  /**
   * Return absolute IRI of the resource
   * @param id
   * @param context
   * @param parentId
   */
  getAbsoluteIri(id: string, context: object, parentId: string): string {
    let iri = ContextParser.expandTerm(id, context); // expand if reduced ids
    if (parentId) { // and get full URL from parent caller for local files
      let parentIri = new URL(parentId, document.location.href).href;
      iri = new URL(iri, parentIri).href;
    } else {
      iri = new URL(iri, document.location.href).href;
    }
    return iri;
  }

  /**
   * Expand all predicates of a resource with a given context
   * @param resource: object
   * @param context: object
   */
  async expandProperties(resource: object, context: object | string) {
    context = await myParser.parse(context);
    for (let prop of Object.keys(resource)) {
      if (!prop) continue;
      this.objectReplaceProperty(resource, prop, ContextParser.expandTerm(prop, context, true));
    }
    return resource
  }

  /**
   * Change the key of an object
   * @param object: object
   * @param oldProp: string - current key
   * @param newProp: string - new key to set
   */
  objectReplaceProperty(object: object, oldProp: string, newProp: string) {
    if (newProp !== oldProp) {
      Object.defineProperty(
        object,
        newProp,
        Object.getOwnPropertyDescriptor(object, oldProp) || ''
      );
      delete object[oldProp];
    }
  }

  /**
   * Get the property of a resource for a given path
   * @param path: string
   */
  async get(path: any) {
    if (!path) return;
    const path1: string[] = path.split('.');
    const path2: string[] = [];
    let value: any;
    while (true) {
      try {
        value = this.resource[this.getExpandedPredicate(path1[0])];
      } catch (e) { break }

      if (path1.length <= 1) break; // no dot path
      const lastPath1El = path1.pop();
      if(lastPath1El) path2.unshift(lastPath1El);
    }
    if (path2.length === 0) { // end of the path
      if (!value || !value['@id']) return value; // no value or not a resource
      return await this.getResource(value['@id'], this.clientContext, this.parentId || this.resourceId); // return complete resource
    }
    let resource = await this.getResource(value['@id'], this.clientContext, this.parentId || this.resourceId);
    return resource[path2.join('.')]; // return value
    // return new CustomGetter(value['@id'], this.clientContext, {}, this.iri).init().then(res => res ? res.get(path2.join('.')) : undefined);
  }

  /**
   * Cache resource in the store, and return the created proxy
   * @param id
   * @param context
   * @param iriParent
   */
  async getResource(id: string, context: object, iriParent: string) {
    await store.initGraph(id, context, iriParent);
    return store.get(id);
  }

  /**
   * Return true if the resource is a container
   */
  isContainer() {
    return this.resource["@type"] == "ldp:Container";
  }

  /**
   * Get all properties of a resource
   */
  getProperties() {
    return Object.keys(this.resource).map(prop => this.getCompactedPredicate(prop));
  }

  getChildren() {
    return this.resource[this.getExpandedPredicate("ldp:contains")];
  }

  getLdpContains() {
    return this.resource[this.getExpandedPredicate("ldp:contains")].map(res => store.get(res['@id']))
  }

  /**
   * Remove the resource from the cache
   */
  async clearCache() {
    // TODO
  }

  getExpandedPredicate(property: string) { return ContextParser.expandTerm(property, this.clientContext, true) }
  getCompactedPredicate(property: string) { return ContextParser.compactIri(property, this.clientContext, true) }
  getCompactedIri(id: string) { return ContextParser.compactIri(id, this.clientContext) }
  toString() { return this.getCompactedIri(this.resource['@id']) }
  [Symbol.toPrimitive]() { return this.getCompactedIri(this.resource['@id']) }


  /**
   * Returns a Proxy which handles the different get requests
   * @param data: object - content of the resource if already loaded
   */
  async getProxy(data = null) {
    await this.init(data);
    return new Proxy(this, {
      get: (resource, property) => {
        if (!this.resource) return undefined;
        if (typeof resource[property] === 'function') return resource[property].bind(resource)

        switch (property) {
          case '@id':
            return this.getCompactedIri(this.resource['@id']); // Compact @id if possible
          case '@type':
            return this.resource['@type']; // return synchronously
          case 'properties':
            return this.getProperties();
          case 'ldp:contains': // returns standard arrays synchronously
            return this.getLdpContains()
          case 'permissions':
            return this.resource[this.getExpandedPredicate(property)]
          case 'then':
            return;
          default:
            return resource.get(property);
        }
      }
    })
  }
}