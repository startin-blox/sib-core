//@ts-ignore
import JSONLDContextParser from 'https://dev.jspm.io/jsonld-context-parser@1';

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
  geo: "http://www.w3.org/2003/01/geo/wgs84_pos#",
  lat: "geo:lat",
  lng: "geo:long"
};

export class Store {
  cache: Map<string, any>;
  loadingList: String[];
  headers: Promise<Headers>;

  constructor(private idTokenPromise: Promise<string>) {
    this.cache = new Map();
    this.loadingList = [];
    this.headers = (async() => {
      const headers = new Headers();
      headers.set('Content-Type', 'application/ld+json');
      try {
        const idToken = await this.idTokenPromise;
        if(idToken != null)
          headers.set('Authorization', `Bearer ${idToken}`);
      } catch {}
      return headers;
    })();
  }

  async initGraph(id: string, context = {}, idParent = ""): Promise<CustomGetter> {
    return new Promise(async (resolve) => {
      if (!this.cache.has(id)) {
        document.addEventListener('resourceReady', this.resolveResource(id, resolve));

        if (!this.loadingList.includes(id)) {
          this.loadingList.push(id);
          const getter = await new CustomGetter(id, context, {}, idParent, await this.headers).getProxy();
          await this.cacheGraph(id, getter, context, getter['@context'], idParent || id);
          this.loadingList = this.loadingList.filter(value => value != id);
          document.dispatchEvent(new CustomEvent('resourceReady', { detail: { id: id, resource: this.cache.get(id) } }));
        }
      } else {
        resolve(this.cache.get(id));
      }
    });
  }

  resolveResource = function(id: string, resolve) {
    const handler = function(event) {
      if (event.detail.id === id) {
        resolve(event.detail.resource);
        document.removeEventListener('resourceReady', handler);
      }
    };
    return handler;
  };

  async cacheGraph(key: string, resource: any, context: object, parentContext: object, parentId: string) {
    if (resource.properties) { // if proxy, cache it
      if (this.cache.get(key)) { // if already cached, merge data
        this.cache.get(key).merge(resource);
      } else {  // else, put in cache
        this.cache.set(key, resource);
      }
    }

    // Cache sub objects
    if (resource.getSubOjects) {
      for (let res of resource.getSubOjects()) {
        const resourceProxy = await new CustomGetter(res['@id'], context, parentContext, parentId, await this.headers).getProxy(res);
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
      if (resource['@id'].match(/^b\d+$/)) return; // and not anonymous node
      if (resource['@type'] === "ldp:Container") { // if source, init graph of source
        await this.initGraph(resource['@id'], context, parentId);
        return;
      }

      const resourceProxy = await new CustomGetter(resource['@id'], context, parentContext, parentId, await this.headers).getProxy(resource);
      await this.cacheGraph(key, resourceProxy, context, parentContext, parentId);
    }
  }

  get(id: string): CustomGetter | null {
    return this.cache.get(id) || null;
  }

  clearCache(id: string): void {
    if (this.cache.has(id)) {
      // For federation, clear each source
      const resource = this.cache.get(id);
      if (resource['@type'] === 'ldp:Container') {
        resource['ldp:contains'].forEach((child: object) => {
          if (child['@type'] === 'ldp:Container') this.cache.delete(child['@id'])
        })
      }

      this.cache.delete(id);
    }
  }

  async post(resource: object, id: string): Promise<string | null> {
    return fetch(this._getExpandedId(id, resource['@context']), {
      method: 'POST',
      headers: await this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    }).then(response => response.headers.get('Location') || null);
  }

  async put(resource: object, id: string): Promise<string | null> {
    return fetch(this._getExpandedId(id, resource['@context']), {
      method: 'PUT',
      headers: await this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    }).then(response => response.headers.get('Location') || null);
  }

  async patch(resource: object, id: string): Promise<string | null> {
    return fetch(this._getExpandedId(id, resource['@context']), {
      method: 'PATCH',
      headers: await this.headers,
      body: JSON.stringify(resource),
      credentials: 'include'
    }).then(response => response.headers.get('Location') || null);
  }

  async delete(id: string, context: object = {}) {
    const deleted = await fetch(this._getExpandedId(id, context), {
      method: 'DELETE',
      headers: await this.headers,
      credentials: 'include'
    });
    return deleted;
  }

  _getExpandedId(id: string, context: object) {
    return (context && Object.keys(context)) ? ContextParser.expandTerm(id, context) : id;
  }
}

const sibAuth = document.querySelector('sib-auth');
const idTokenPromise = sibAuth ? customElements.whenDefined(sibAuth.localName).then( 
  () => sibAuth['getUserIdToken']()
) : Promise.reject();

export const store = new Store(idTokenPromise);

class CustomGetter {
  resourceId: string; // id of the requested resource
  resource: any; // content of the requested resource
  clientContext: object; // context given by the app
  serverContext: object; // context given by the server
  parentId: string; // id of the parent resource, used to get the absolute url of the current resource
  headers = new Headers();

  constructor(resourceId: string, clientContext: object, serverContext: object = {}, parentId: string = "", headers: Headers) {
    this.resourceId = resourceId;
    this.clientContext = clientContext;
    this.serverContext = serverContext;
    this.resource = null;
    this.parentId = parentId;
    this.headers = headers;
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
        headers: this.headers,
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
    if (!value) return undefined;
    let resource = await this.getResource(value['@id'], this.clientContext, this.parentId || this.resourceId);
    return resource ? await resource[path2.join('.')] : undefined; // return value
  }

  /**
   * Cache resource in the store, and return the created proxy
   * @param id
   * @param context
   * @param iriParent
   */
  async getResource(id: string, context: object, iriParent: string): Promise<CustomGetter | null> {
    return store.initGraph(id, context, iriParent);
  }

  /**
   * Return true if the resource is a container
   */
  isContainer(): boolean {
    return this.resource["@type"] == "ldp:Container";
  }

  /**
   * Get all properties of a resource
   */
  getProperties(): string[] {
    return Object.keys(this.resource).map(prop => this.getCompactedPredicate(prop));
  }

  /**
   * Get children of container as objects
   */
  getChildren(): object[] {
    return this.resource[this.getExpandedPredicate("ldp:contains")] || [];
  }

  /**
   * Get children of container as Proxys
   */
  getLdpContains(): CustomGetter[] {
    const children = this.resource[this.getExpandedPredicate("ldp:contains")];
    return children ? children.map((res: object) => store.get(res['@id'])) : [];
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

  merge(resource: CustomGetter) {
    this.resource = {...this.getResourceData(), ...resource.getResourceData()}
  }

  getResourceData(): object { return this.resource }

  /**
   * return true if prop is a resource with an @id and some properties
   * @param prop
   */
  isFullResource(prop: any): boolean {
    return prop && typeof prop == "object" && prop['@id'] != undefined && Object.keys(prop).length > 1;
  }

  getPermissions(): string[] {
    const permissions = this.resource[this.getExpandedPredicate("permissions")];
    return permissions ? permissions.map(perm => ContextParser.expandTerm(perm.mode['@type'], this.serverContext, true)) : [];
  }

  /**
   * Remove the resource from the cache
   */
  clearCache(): void {
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
            return this.getCompactedIri(this.resource['@id'] || this.resourceId); // Compact @id if possible
          case '@type':
            return this.resource['@type']; // return synchronously
          case 'properties':
            return this.getProperties();
          case 'ldp:contains':
            return this.getLdpContains(); // returns standard arrays synchronously
          case 'permissions':
            return this.getPermissions(); // get expanded permissions
          case 'then':
            return;
          default:
            return resource.get(property);
        }
      }
    })
  }
}