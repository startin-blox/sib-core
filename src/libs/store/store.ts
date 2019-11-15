//@ts-ignore
import JSONLDContextParser from 'https://dev.jspm.io/jsonld-context-parser';

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
      this.cache.set(key, resource); // put in cache
    }

    // Cache sub objects
    if (resource.getSubOjects) {
      for (let res of resource.getSubOjects()) {
        const resourceProxy = await new CustomGetter(res['@id'], context, parentContext, parentId).getProxy(res);
        await this.cacheGraph(res['@id'], resourceProxy, context, parentContext, parentId);
      }
    }

    // Cache children
    if (resource['@type'] == "ldp:Container" && resource.getChildren) {
      for (let res of resource.getChildren()) {
        await this.cacheGraph(res['@id'], res, context, parentContext, parentId)
      }
      return;
    }

    // Cache resource
    if (resource['@id'] && !resource.properties) {
      if (
        this.cache.has(resource['@id']) || // not already in cache
        resource['@id'].match(/^b\d+$/) // and not anonymous node
      ) return;

      if (resource['@type'] === "ldp:Container") { // if source, init graph of source
        await this.initGraph(resource['@id'], context, parentId);
        return;
      }

      const resourceProxy = await new CustomGetter(resource['@id'], context, parentContext, parentId).getProxy(resource);
      await this.cacheGraph(key, resourceProxy, context, parentContext, parentId);
    }
  }

  get(id: string): CustomGetter | null {
    return this.cache.get(id) || null;
  }

  clearCache(id: string): void {
    if (this.cache.has(id)) {
      this.cache.delete(id);
    }
  }

  async post(resource: object, id: string): Promise<string | null> {
    return fetch(this._getExpandedId(id, resource['@context']), {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    }).then(response => response.headers.get('Location') || null);
  }

  async put(resource: object, id: string): Promise<string | null> {
    return fetch(this._getExpandedId(id, resource['@context']), {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    }).then(response => response.headers.get('Location') || null);
  }

  async patch(resource: object, id: string): Promise<string | null> {
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
  resourceId: string; // id of the requested resource
  resource: any; // content of the requested resource
  clientContext: object; // context given by the app
  serverContext: object; // context given by the server
  parentId: string; // id of the parent resource, used to get the absolute url of the current resource

  constructor(resourceId: string, clientContext: object, serverContext: object = {}, parentId: string = "") {
    this.resourceId = resourceId;
    this.clientContext = clientContext;
    this.serverContext = serverContext;
    this.resource = null;
    this.parentId = parentId;
  }

  /**
   * Fetch datas if needed and expand all properties
   * @param data : object - content of the resource if already loaded
   */
  async init(data: object | null = null) {
    this.clientContext = await myParser.parse(this.clientContext);
    const iri = this.getAbsoluteIri(this.resourceId, this.clientContext, this.parentId);

    // Fetch datas if needed
    if (data && Object.keys(data).length == 1) { data = null } // if only @id in resource, fetch it
    let resource;
    try {
      resource = data || await fetch(iri, {
        method: 'GET',
        credentials: 'include'
      }).then(response => {
        if (response.status !== 200) return;
        return response.json()
      })
    } catch (e) { }
    if (!resource) return

    this.serverContext = await myParser.parse([this.serverContext, resource['@context'] || {}]);

    // Expand properties before saving
    this.resource = this.expandProperties({ ...resource }, this.serverContext);

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
  expandProperties(resource: object, context: object | string) {
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
    return resource ? resource[path2.join('.')] : undefined; // return value
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

  /**
   * Get children of container as objects
   */
  getChildren() {
    return this.resource[this.getExpandedPredicate("ldp:contains")];
  }

  /**
   * Get children of container as Proxys
   */
  getLdpContains(): CustomGetter[] {
    return this.resource[this.getExpandedPredicate("ldp:contains")].map((res: object) => store.get(res['@id']))
  }

  /**
   * Get all nested resource or containers which contains datas
   */
  getSubOjects() {
    let subObjects: any = [];
    for (let p of Object.keys(this.resource)) {
      let property = this.resource[p];
      if (!this.isFullResource(property)) continue; // if not a resource, stop
      if (property['@type'] == "ldp:Container" &&
        (property['ldp:contains'] == undefined ||
          (property['ldp:contains'].length >= 1 && !this.isFullResource(property['ldp:contains'][0])))
      ) continue; // if not a full container
      subObjects.push(property)
    }
    return subObjects;
  }

  /**
   * return true if prop is a resource with an @id and some properties
   * @param prop
   */
  isFullResource(prop: any) {
    return prop && typeof prop == "object" && prop['@id'] != undefined && Object.keys(prop).length > 1;
  }

  /**
   * Remove the resource from the cache
   */
  clearCache() {
    store.clearCache(this.resourceId);
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
          case 'ldp:contains':
            return this.getLdpContains(); // returns standard arrays synchronously
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