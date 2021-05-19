import JSONLDContextParser from 'jsonld-context-parser';
//@ts-ignore
import PubSub from 'https://cdn.skypack.dev/pubsub-js';
import type { Resource } from '../../mixins/interfaces';

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

class Store {
  cache: Map<string, any>;
  subscriptionIndex: Map<string, any>; // index of all the containers per resource
  subscriptionVirtualContainersIndex: Map<string, any>; // index of all the containers per resource
  loadingList: Set<String>;
  headers: Headers;
  fetch: Promise<any> | undefined;
  session: Promise<any> | undefined;

  constructor(private storeOptions: StoreOptions) {
    this.cache = new Map();
    this.subscriptionIndex = new Map();
    this.subscriptionVirtualContainersIndex = new Map();
    this.loadingList = new Set();
    this.headers = new Headers();
    this.headers.set('Content-Type', 'application/ld+json');
    this.fetch = this.storeOptions.fetchMethod;
    this.session = this.storeOptions.session;
  }

  /**
   * Fetch data and cache it
   * @param id - uri of the resource to fetch
   * @param context - context used to expand id and predicates when accessing the resource
   * @param idParent - uri of the parent caller used to expand uri for local files
   *
   * @returns The fetched resource
   *
   * @async
   */

  async getData(id: string, context:any = {}, idParent = "", localData?: object): Promise<Resource|null> {
    const isLocalId = id.startsWith('store://local.');

    if (localData == null && this.cache.has(id) && !this.loadingList.has(id)) {
      const resource = this.get(id);
      if (resource && resource.isFullResource()) return resource; // if resource is not complete, re-fetch it
    }

    return new Promise(async (resolve) => {
      document.addEventListener('resourceReady', this.resolveResource(id, resolve));

      if (this.loadingList.has(id)) return;
      this.loadingList.add(id);

      // Generate proxy
      const clientContext = await myParser.parse(context);
      let resource: any = null;
      if(isLocalId) {
        if(localData == null) localData = {};
        localData["@id"] = id;
        resource = localData;
      } else try {
        resource = localData || await this.fetchData(id, clientContext, idParent);
      } catch (error) { console.error(error) }
      if (!resource) {
        this.loadingList.delete(id);
        resolve(null);
        return;
      }
      const serverContext = await myParser.parse([resource['@context'] || {}]);
      const resourceProxy = new CustomGetter(id, resource, clientContext, serverContext, idParent).getProxy();

      // Cache proxy
      await this.cacheGraph(id, resourceProxy, clientContext, serverContext, idParent || id);
      this.loadingList.delete(id);
      document.dispatchEvent(new CustomEvent('resourceReady', { detail: { id: id, resource: this.get(id) } }));
    });
  }

  async fetchAuthn(iri: string, options: any) {
    let authenticated = false;
    if (this.session) authenticated = await this.session;
    return (this.fetch && authenticated)
      ? this.fetch.then(fn => fn(iri, options))
      : fetch(iri, options);
  }

  async fetchData(id: string, context = {}, idParent = "") {
    const iri = this._getAbsoluteIri(id, context, idParent);
    const headers = this.headers;
    headers.set('accept-language', this._getLanguage());
    return this.fetchAuthn(iri, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    }).then(response => {
      if (!response.ok) return;
      return response.json()
    })
  }

  async cacheGraph(key: string, resource: any, clientContext: object, parentContext: object, parentId: string) {
    if (resource.properties) { // if proxy, cache it
      if (this.get(key)) { // if already cached, merge data
        this.cache.get(key).merge(resource);
      } else {  // else, put in cache
        this.cache.set(key, resource);
      }
    }

    // Cache nested resources
    if (resource.getSubObjects) {
      for (let res of resource.getSubObjects()) {
        let newParentContext = parentContext;
        // If additional context in resource, use it to expand properties
        if (res['@context']) newParentContext = await myParser.parse({ ...parentContext, ...res['@context'] });
        const resourceProxy = new CustomGetter(res['@id'], res, clientContext, newParentContext, parentId).getProxy();
        // this.subscribeResourceTo(resource['@id'], res['@id']); // removed to prevent useless updates
        await this.cacheGraph(res['@id'], resourceProxy, clientContext, parentContext, parentId);
      }
    }

    // Cache children of container
    if (resource['@type'] == "ldp:Container" && resource.getChildren) {
      const cacheChildrenPromises: Promise<void>[] = [];
      for (let res of resource.getChildren()) {
        this.subscribeResourceTo(resource['@id'], res['@id']);
        cacheChildrenPromises.push(this.cacheGraph(res['@id'], res, clientContext, parentContext, parentId))
      }
      await Promise.all(cacheChildrenPromises);
      return;
    }

    // Create proxy, (fetch data) and cache resource
    if (resource['@id'] && !resource.properties) {
      if (resource['@id'].match(/^b\d+$/)) return; // not anonymous node
      // Fetch data if
      if (resource['@type'] === "sib:federatedContainer") { // if object is federated container
        await this.getData(resource['@id'], clientContext, parentId); // then init graph
        return;
      }
      const resourceProxy = new CustomGetter(resource['@id'], resource, clientContext, parentContext, parentId).getProxy();
      await this.cacheGraph(key, resourceProxy, clientContext, parentContext, parentId);
    }
  }

  async _fetch(method: string, resource: object, id: string): Promise<any> {
    if(method !== '_LOCAL')
      return fetch(id, {
        method: method,
        headers: await this.headers,
        body: JSON.stringify(resource),
        credentials: 'include'
      })

    const resourceProxy = store.get(id);
    const clientContext = resourceProxy ? resourceProxy.clientContext : resource['@context']
    this.clearCache(id);
    await this.getData(id, clientContext, '', resource);
    return {ok: true}
  }

  async _updateResource(method: string, resource: object, id: string) {
    if (!['POST', 'PUT', 'PATCH', '_LOCAL'].includes(method)) throw new Error('Error: method not allowed');

    const context = await myParser.parse([resource['@context'] || {}]); // parse context before expandTerm
    const expandedId = this._getExpandedId(id, context);
    return this._fetch(method, resource, id).then(response => {
      if (response.ok) {
        if(method !== '_LOCAL') this.clearCache(expandedId); // clear cache
        this.getData(expandedId, resource['@context']).then(async () => { // re-fetch data
          const nestedResources = await this.getNestedResources(resource, id);
          const resourcesToRefresh = this.subscriptionVirtualContainersIndex.get(expandedId) || [];
          const resourcesToNotify = this.subscriptionIndex.get(expandedId) || [];

          return this.refreshResources([...nestedResources, ...resourcesToRefresh]) // refresh related resources
            .then(resourceIds => this.notifyResources([expandedId, ...resourceIds, ...resourcesToNotify])); // notify components
        });
        return response.headers?.get('Location') || null;
      } else {
        throw response;
      }
    });
  }

  /**
   * Clear cache and refetch data for a list of ids
   * @param resourceIds -
   * @returns - all the resource ids
   */
  async refreshResources(resourceIds: string[]) {
    resourceIds = [...new Set(resourceIds)]; // remove duplicates
    const resourceWithContexts = resourceIds.map(resourceId => ({ "id": resourceId, "context": store.get(resourceId)?.clientContext }));
    for (const resource of resourceWithContexts) this.clearCache(resource.id);
    await Promise.all(resourceWithContexts.map(({ id, context }) => this.getData(id, context || base_context)))
    return resourceIds;
  }
  /**
   * Notifies all components for a list of ids
   * @param resourceIds -
   */
  async notifyResources(resourceIds: string[]) {
    resourceIds = [...new Set(resourceIds)]; // remove duplicates
    for (const id of resourceIds) PubSub.publish(id);
  }

  /**
   * Return id of nested properties of a resource
   * @param resource - object
   * @param id - string
   */
  async getNestedResources(resource: object, id: string) {
    const cachedResource = store.get(id);
    if (!cachedResource || cachedResource.isContainer()) return [];
    let nestedProperties:any[] = [];
    const excludeKeys = ['@context'];
    for (let p of Object.keys(resource)) {
      if (resource[p] && typeof resource[p] === 'object' && !excludeKeys.includes(p)) {
        const property = await cachedResource[p];
        if (property) nestedProperties.push(property['@id']);
      }
    }
    return nestedProperties.filter(a=> a != null);
  }

  /**
   * Returns the resource with id from the cache
   * @param id - id of the resource to retrieve
   *
   * @returns Resource (Proxy) if in the cache, null otherwise
   */
  get(id: string): Resource | null {
    return this.cache.get(id) || null;
  }


  /**
   * Removes a resource from the cache
   * @param id - id of the resource to remove from the cache
   */
  clearCache(id: string): void {
    if (this.cache.has(id)) {
      // For federation, clear each source
      const resource = this.cache.get(id);
      if (resource['@type'] === 'ldp:Container') {
        resource['ldp:contains'].forEach((child: object) => {
          if (child && child['@type'] === 'ldp:Container') this.cache.delete(child['@id'])
        })
      }

      this.cache.delete(id);
    }
  }

  /**
   * Send data to create a local resource in a container
   * @param resource - resource to create
   * @param id - uri of the container to add resource. should start with ``
   *
   * @returns id of the posted resource
   */
  async setLocalData(resource: object, id: string): Promise<string | null> {
    return this._updateResource('_LOCAL', resource, id);
  }

  /**
   * Send a POST request to create a resource in a container
   * @param resource - resource to create
   * @param id - uri of the container to add resource
   *
   * @returns id of the posted resource
   */
  async post(resource: object, id: string): Promise<string | null> {
    return this._updateResource('POST', resource, id);
  }

  /**
   * Send a PUT request to edit a resource
   * @param resource - resource data to send
   * @param id - uri of the resource to edit
   *
   * @returns id of the edited resource
   */
  async put(resource: object, id: string): Promise<string | null> {
    return this._updateResource('PUT', resource, id);
  }

  /**
   * Send a PATCH request to edit a resource
   * @param resource - resource data to send
   * @param id - uri of the resource to patch
   *
   * @returns id of the edited resource
   */
  async patch(resource: object, id: string): Promise<string | null> {
    return this._updateResource('PATCH', resource, id);
  }

  /**
   * Send a DELETE request to delete a resource
   * @param id - uri of the resource to delete
   * @param context - can be used to expand id
   *
   * @returns id of the deleted resource
   */
  async delete(id: string, context: object = {}) {
    const expandedId = this._getExpandedId(id, context);
    const deleted = await this.fetchAuthn(expandedId, {
      method: 'DELETE',
      headers: this.headers,
      credentials: 'include'
    });

    const resourcesToNotify = this.subscriptionIndex.get(expandedId) || [];
    const resourcesToRefresh = this.subscriptionVirtualContainersIndex.get(expandedId) || [];

    this.refreshResources([...resourcesToNotify, ...resourcesToRefresh])
      .then(resourceIds => this.notifyResources(resourceIds));

    return deleted;
  }

  _getExpandedId(id: string, context: object) {
    return (context && Object.keys(context)) ? ContextParser.expandTerm(id, context) : id;
  }

  /**
   * Make a resource listen changes of another one
   * @param resourceId - id of the resource which needs to be updated
   * @param nestedResourceId - id of the resource which will change
   */
  subscribeResourceTo(resourceId: string, nestedResourceId: string) {
    const existingSubscriptions = this.subscriptionIndex.get(nestedResourceId) || [];
    this.subscriptionIndex.set(nestedResourceId, [...new Set([...existingSubscriptions, resourceId])])
  }

  /**
   * Make a virtual container listen for changes of a resource
   * @param virtualContainerId - id of the container which needs to be updated
   * @param nestedResourceId - id of the resource which will change
   */
  subscribeVirtualContainerTo(virtualContainerId: string, nestedResourceId: string) {
    const existingSubscriptions = this.subscriptionVirtualContainersIndex.get(nestedResourceId) || [];
    this.subscriptionVirtualContainersIndex.set(nestedResourceId, [...new Set([...existingSubscriptions, virtualContainerId])])
  }

  /**
   * Return absolute IRI of the resource
   * @param id
   * @param context
   * @param parentId
   */
  _getAbsoluteIri(id: string, context: object, parentId: string): string {
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
   * Check if object is a full resource
   * @param resource
   */
  _resourceIsComplete(resource: object) {
    return !!(Object.keys(resource).filter(p => !p.startsWith('@')).length > 0 && resource['@id'])
  }

  /**
   * Return language of the users
   */
  _getLanguage() {
    return localStorage.getItem('language') || window.navigator.language.slice(0,2);
  }

  /**
   * Save the preferred language of the user
   * @param selectedLanguageCode
   */
  selectLanguage(selectedLanguageCode: string) {
    localStorage.setItem('language', selectedLanguageCode);
  }

  resolveResource = function(id: string, resolve) {
    const handler = function(event) {
      if (event.detail.id === id) {
        resolve(event.detail.resource);
        // TODO : callback
        document.removeEventListener('resourceReady', handler);
      }
    };
    return handler;
  };
}

let store: Store;
if (window.sibStore) {
  store = window.sibStore;
} else {
  const sibAuth = document.querySelector('sib-auth');
  const storeOptions: StoreOptions = {}

  if (sibAuth) {
    const sibAuthDefined = customElements.whenDefined(sibAuth.localName);
    storeOptions.session = sibAuthDefined.then(() => (sibAuth as any).session)
    storeOptions.fetchMethod = sibAuthDefined.then(() => (sibAuth as any).getFetch())
  }

  store = new Store(storeOptions);
  window.sibStore = store;
}

export {
  store
};


class CustomGetter {
  resource: any; // content of the requested resource
  resourceId: string;
  clientContext: object; // context given by the app
  serverContext: object; // context given by the server
  parentId: string; // id of the parent resource, used to get the absolute url of the current resource

  constructor(resourceId: string, resource: object, clientContext: object, serverContext: object = {}, parentId: string = "") {
    this.clientContext = clientContext;
    this.serverContext = serverContext;
    this.parentId = parentId;
    this.resource = this.expandProperties({ ...resource }, serverContext);
    this.resourceId = resourceId;
  }

  /**
   * Expand all predicates of a resource with a given context
   * @param resource: object
   * @param context: object
   */
  expandProperties(resource: object, context: object | string) {
    for (let prop of Object.keys(resource)) {
      if (!prop) continue;
      this.objectReplaceProperty(resource, prop, ContextParser.expandTerm(prop, context as JSONLDContextParser.IJsonLdContextNormalized, true));
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
    if (!this.isFullResource()) { // if resource is not complete, fetch it first
      await this.getResource(this.resourceId, this.clientContext, this.parentId);
    }
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

    store.subscribeResourceTo(this.resourceId, value['@id']);
    return resource ? await resource[path2.join('.')] : undefined; // return value
  }

  /**
   * Cache resource in the store, and return the created proxy
   * @param id
   * @param context
   * @param iriParent
   */
  async getResource(id: string, context: object, iriParent: string): Promise<Resource | null> {
    return store.getData(id, context, iriParent);
  }

  /**
   * Return true if the resource is a container
   */
  isContainer(): boolean {
    return this.resource["@type"] == "ldp:Container" || this.resource["@type"] == "sib:federatedContainer";
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
  getSubObjects() {
    let subObjects: any = [];
    for (let p of Object.keys(this.resource)) {
      let property = this.resource[p];
      if (!this.isFullNestedResource(property)) continue; // if not a resource, stop
      if (property['@type'] == "ldp:Container" &&
        (property['ldp:contains'] == undefined ||
          (property['ldp:contains'].length >= 1 && !this.isFullNestedResource(property['ldp:contains'][0])))
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
  isFullNestedResource(prop: any): boolean {
    return prop &&
      typeof prop == "object" &&
      prop['@id'] != undefined &&
      Object.keys(prop).filter(p => !p.startsWith('@')).length > 0;
  }
  /**
   * return true resource seems complete
   * @param prop
   */
  isFullResource(): boolean {
    return Object.keys(this.resource).filter(p => !p.startsWith('@')).length > 0;
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
   */
  getProxy() {
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
            return this.getPermissions(); // get expanded permissions
          case 'clientContext':
            return this.clientContext; // get saved client context to re-fetch easily a resource
          case 'then':
            return;
          default:
            return resource.get(property);
        }
      }
    })
  }
}