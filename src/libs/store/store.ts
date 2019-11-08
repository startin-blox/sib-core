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

  async initGraph(id: string, context = {}) {
    if (!this.cache.has(id)) {
      const getter = await new CustomGetter(id, context).getProxy();
      this.cache.set(id, getter);

      // Add children to cache
      if (getter['@type'] == "ldp:Container") {
        for (let resource of getter['ldp:contains']) {
          if (this.cache.has(resource['@id']) || resource['@id'].match(/^b\d+$/)) continue;

          const resourceProxy = await new CustomGetter(resource['@id'], context, getter['@context']).getProxy(resource);
          this.cache.set(resource['@id'], resourceProxy);
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


class CustomGetter {
  resourceId: string;
  resource: any;
  clientContext: object;
  serverContext: object;

  constructor(resourceId: string, clientContext: object, serverContext: object = {}) {
    this.resourceId = resourceId;
    this.clientContext = clientContext;
    this.serverContext = serverContext;
    this.resource = null;
  }

  /**
   * Fetch datas if needed and expand all properties
   * @param data : object - content of the resource if already loaded
   */
  async init(data = null) {
    this.clientContext = await myParser.parse(this.clientContext);

    let iri = ContextParser.expandTerm(this.resourceId, this.clientContext); // expand if reduced ids
    iri = new URL(iri, document.location.href).href; // and get full URL for local files

    // Fetch datas if needed
    let resource = data || await fetch(iri, {
      method: 'GET',
      credentials: 'include'
    }).then(response => response.json());

    this.serverContext = await myParser.parse([this.serverContext, resource['@context'] || {}]);

    // Expand properties
    resource = await this.expandProperties({ ...resource }, this.serverContext);
    this.resource = resource;

    return this;
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
      return await new CustomGetter(value['@id'], this.clientContext).getProxy();
    }
    return new CustomGetter(value['@id'], this.clientContext).init().then(res => res.get(path2.join('.')));
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
        if (typeof resource[property] === 'function') return resource[property].bind(resource)

        switch (property) {
          case '@id':
            return this.getCompactedIri(this.resource['@id']); // Compact @id if possible
          case '@type':
            return this.resource['@type']; // return synchronously
          case 'properties':
            return this.getProperties();
          case 'ldp:contains': // returns standard arrays synchronously
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