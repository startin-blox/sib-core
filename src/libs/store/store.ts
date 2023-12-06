import JSONLDContextParser from 'jsonld-context-parser';
//@ts-ignore
import PubSub from 'https://cdn.skypack.dev/pubsub-js';

import jsonld from 'jsonld';
import { CustomGetter } from './custom-getter';

import type { Resource } from '../../mixins/interfaces';
import type { ServerSearchOptions } from './server-search';
import { appendServerSearchToIri } from './server-search';

import type { ServerPaginationOptions } from './server-pagination';
import { appendServerPaginationToIri } from './server-pagination';

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
  headers: object;
  fetch: Promise<any> | undefined;
  session: Promise<any> | undefined;

  constructor(private storeOptions: StoreOptions) {
    this.cache = new Map();
    this.subscriptionIndex = new Map();
    this.subscriptionVirtualContainersIndex = new Map();
    this.loadingList = new Set();
    this.headers = {'Accept': 'application/ld+json', 'Content-Type': 'application/ld+json', 'Cache-Control': 'must-revalidate'};
    this.fetch = this.storeOptions.fetchMethod;
    this.session = this.storeOptions.session;
  }

  /**
   * Fetch data and cache it
   * @param id - uri of the resource to fetch
   * @param context - context used to expand id and predicates when accessing the resource
   * @param parentId - uri of the parent caller used to expand uri for local files
   * @param localData - data to put in cache
   * @param forceFetch - force the fetch of data
   * @param serverPagination - Server pagination options
   * @param serverSearch - Server search options
   * @param predicateName - predicate name if we target a specific predicate from the resource, useful for arrays
   * 
   * @returns The fetched resource
   *
   * @async
   */
  async getData(
    id: string,
    context:any = {},
    parentId = "",
    localData?: object,
    forceFetch: boolean = false,
    serverPagination?: ServerPaginationOptions,
    serverSearch?: ServerSearchOptions
  ): Promise<Resource|null> {
    let key = id;
    if (serverPagination) {
      key = id + "#p" + serverPagination.limit + "?o" + serverPagination.offset;
    }

    if (serverSearch) {
      key = appendServerSearchToIri(key, serverSearch)
    }

    if (localData == null && this.cache.has(key) && !this.loadingList.has(key)) {
      const resource = this.get(key);
      if (resource && resource.isFullResource?.() && !forceFetch) return resource; // if resource is not complete, re-fetch it
    }

    return new Promise(async (resolve) => {
      document.addEventListener('resourceReady', this.resolveResource(key, resolve));

      if (this.loadingList.has(key)) return;
      this.loadingList.add(key);

      // Generate proxy
      const clientContext = await myParser.parse(context);
      let resource: any = null;
      if(this._isLocalId(id)) {
        if(localData == null) localData = {};
        localData["@id"] = id;
        resource = localData;
      } else try {
        resource = localData || await this.fetchData(id, clientContext, parentId, serverPagination, serverSearch);
      } catch (error) { console.error(error) }
      if (!resource) {
        this.loadingList.delete(key);
        resolve(null);
        return;
      }

      const serverContext = await myParser.parse([resource['@context'] || {}]);
      // const resourceProxy = new CustomGetter(key, resource, clientContext, serverContext, parentId ? parentId : key, serverPagination, serverSearch).getProxy();
      // Cache proxy
      await this.cacheGraph(resource, clientContext, serverContext, parentId ? parentId : key, serverPagination, serverSearch);
      this.loadingList.delete(key);
      document.dispatchEvent(new CustomEvent('resourceReady', { detail: { id: key, resource: this.get(key) } }));
    });
  }

  async fetchAuthn(iri: string, options: any) {
    let authenticated = false;
    if (this.session) authenticated = await this.session;

    if (this.fetch && authenticated) { // authenticated
      return this.fetch.then(fn => fn(iri, options))
    } else { // anonymous
      if (options.headers) options.headers = this._convertHeaders(options.headers);
      return fetch(iri, options).then(function(response) {
        if (options.method === "PURGE" && !response.ok && response.status === 404) {
          const err = new Error("PURGE call is returning 404");
          throw err;
        }
        return response;
      });
    }
  }

  /**
   * Fetch resource
   * @param id - id of the resource
   * @param context - context used to expand id
   * @param idParent - id of the caller resource. Needed to expand id
   * @param serverPagination - Server pagination query params
   * @param serverSearch - Server search query params
   * @returns data in json
   */
  async fetchData(
    id: string,
    context = {},
    parentId = "",
    serverPagination?: ServerPaginationOptions,
    serverSearch?: ServerSearchOptions
  ) {
    let iri = this._getAbsoluteIri(id, context, parentId);
    if (serverPagination) iri = appendServerPaginationToIri(iri, serverPagination);
    if (serverSearch) iri = appendServerSearchToIri(iri, serverSearch);

    const headers = {
      ...this.headers,
      'accept-language': this._getLanguage()
      // 'Prefer' : 'return=representation; max-triple-count="100"' // Commenting out for now as it raises CORS errors
    };


    /**
     * Fetch data with authentication if available (sib-auth)
     * @param iri - iri to call
     * @param options - options of the request
     * @returns - response
     */
    return this.fetchAuthn(iri, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    }).then((response) => {
      if (!response.ok) return;
      return response.json();
    })
  }

    /**
   * Cache the whole graph
   * @param resource - graph fetched
   * @param clientContext - context of the client app
   * @param parentContext - context of the server
   * @param parentId - id of the parent caller
   * @param serverPagination - Server pagination query params
   * @param serverSearch - Server search query params
   */
  async cacheGraph(
    resource: any,
    clientContext: object,
    parentContext: object,
    parentId: string,
    serverPagination?: ServerPaginationOptions,
    serverSearch?: ServerSearchOptions
  ) {
      const flattenedResources = await jsonld.flatten(resource);
      const compactedResources: any[] = await Promise.all(flattenedResources.map(r => jsonld.compact(r, {})))
      for (let resource of compactedResources) {
        let id = resource['@id'] || resource['id'];
        let key = resource['@id'] || resource['id'];

        if(!key) console.log('No key or id for resource:', resource);
        if (key === '/') key = parentId;
        if (key.startsWith('_:b')) key = key + parentId; // anonymous node -> change key before saving in cache
        const resourceProxy = new CustomGetter(key, resource, clientContext, parentContext, parentId, serverPagination, serverSearch).getProxy();
        if (resourceProxy.isContainer()) this.subscribeChildren(resourceProxy, id);

        if (this.get(key)) { // if already cached, merge data
          this.cache.get(key).merge(resourceProxy);
        } else {  // else, put in cache
          this.cacheResource(key, resourceProxy);
        }

        // Cache children of container
        if (resource['@type'] == "ldp:Container" && resource.getChildren) {
          const cacheChildrenPromises: Promise<void>[] = [];

          //TODO: return complete object without the need for the fetch data from the cacheGraph
          for (let res of await resource.getChildren('ldp:contains')) {
            cacheChildrenPromises.push(this.cacheGraph(res, clientContext, parentContext, parentId, serverPagination, serverSearch));
          }
          await Promise.all(cacheChildrenPromises);
          return;
        }

        // Create proxy, (fetch data) and cache resource
        // if (resource['@id'] && !resource.properties) {
        //   if (resource['@id'].match(/^b\d+$/)) return; // not anonymous node
        //   // Fetch data if
        //   if (resource['@type'] === "sib:federatedContainer"  && resource['@cache'] !== 'false') { // if object is federated container
        //     await this.getData(resource['@id'], clientContext, parentId, undefined, false, serverPagination, serverSearch); // then init graph
        //     return;
        //   }
        //   // const resourceProxy = new CustomGetter(key, resource, clientContext, parentContext, parentId, serverPagination, serverSearch).getProxy();
        //   await this.cacheGraph(resource, clientContext, parentContext, parentId, serverPagination, serverSearch);
        // }
      }
    }

  /**
   * Put proxy in cache
   * @param key
   * @param resourceProxy
   */
  cacheResource(key: string, resourceProxy: any) {
    this.cache.set(key, resourceProxy);
  }

  /**
   * Update fetch
   * @param method - 'POST', 'PATCH', 'PUT', '_LOCAL'
   * @param resource - resource to send
   * @param id - uri to update
   * @returns - object
   */
  async _fetch(method: string, resource: object, id: string): Promise<any> {
    if (method !== '_LOCAL')
      return this.fetchAuthn(id, {
        method: method,
        headers: this.headers,
        body: JSON.stringify(resource),
        credentials: 'include'
      });

    const resourceProxy = store.get(id);
    const clientContext = resourceProxy ? {...resourceProxy.clientContext, ...resource['@context']} : resource['@context']
    this.clearCache(id);
    await this.getData(id, clientContext, '', resource);
    return {ok: true}
  }

  /**
   * Subscribe all the children of a container to its parent
   * @param container
   */
  subscribeChildren(container: CustomGetter, containerId: string) {
    if (!container['ldp:contains']) return;
    for (let res of container['ldp:contains']) {
      this.subscribeResourceTo(containerId, res['@id'] || res['id']);
    }
  }
  
  /**
   * Update a resource
   * @param method - can be POST, PUT or PATCH
   * @param resource - content of the updated resource
   * @param id - id of the resource to update
   * @returns void
   */
  async _updateResource(method: string, resource: object, id: string) {
    if (!['POST', 'PUT', 'PATCH', '_LOCAL'].includes(method)) throw new Error('Error: method not allowed');

    const context = await myParser.parse([resource['@context'] || {}]); // parse context before expandTerm
    const expandedId = this._getExpandedId(id, context);
    return this._fetch(method, resource, id).then(async(response) => {
      if (response.ok) {
        if(method !== '_LOCAL') {
          // await this.purge(id);
          this.clearCache(expandedId);
        } // clear cache
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
    resourceIds = [...new Set(resourceIds.filter(id => this.cache.has(id)))]; // remove duplicates and not cached resources
    const resourceWithContexts = resourceIds.map(resourceId => ({ "id": resourceId, "context": store.get(resourceId)?.clientContext }));
    for (const resource of resourceWithContexts) {
      if (!this._isLocalId(resource.id)) this.clearCache(resource.id);
    }
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
    if (!cachedResource || cachedResource.isContainer?.()) return [];
    let nestedProperties:any[] = [];
    const excludeKeys = ['@context'];
    for (let p of Object.keys(resource)) {
      if (resource[p]
        && typeof resource[p] === 'object'
        && !excludeKeys.includes(p)
        && resource[p]['@id']) {
        nestedProperties.push(resource[p]['@id']);
      }
    }
    return nestedProperties;
  }

  /**
   * Returns the resource with id from the cache
   * @param id - id of the resource to retrieve
   *
   * @returns Resource (Proxy) if in the cache, null otherwise
   */
  get(id: string, serverSearch?: ServerSearchOptions): Resource | null {
    if (serverSearch) {
      id = appendServerSearchToIri(id, serverSearch);
    }
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
   * Send a PURGE request to remove a resource from REDIS AD cache
   * @param id - uri of the resource to patch
   *
   * @returns id of the edited resource
   */
  async purge(id: string) {
    await this.fetchAuthn(id, {
      method: "PURGE",
      headers: this.headers
    }).catch(function(error) {
      console.warn('No purge method allowed: ' + error)
    });

    try {
      const fullURL = new URL(id);
      var pathArray = fullURL.pathname.split('/');
      var containerUrl = fullURL.origin + '/' + pathArray[1] + '/';
      const headers = { ...this.headers, 'X-Cache-Purge-Match': 'startswith' };
      await this.fetchAuthn(containerUrl, {
        method: "PURGE",
        headers: headers
      }).catch(function(error) {
        console.warn('No purge method allowed: ' + error)
      });
    } catch (error) {
      console.warn('The resource ID is not a complete URL: ' + error);
      return;
    }
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
    // await this.purge(id);

    const resourcesToNotify = this.subscriptionIndex.get(expandedId) || [];
    const resourcesToRefresh = this.subscriptionVirtualContainersIndex.get(expandedId) || [];

    this.refreshResources([...resourcesToNotify, ...resourcesToRefresh])
      .then(resourceIds => this.notifyResources(resourceIds));

    return deleted;
  }

  /**
   * Convert headers object to Headers
   * @param headersObject - object
   * @returns {Headers}
   */
  _convertHeaders(headersObject: object): Headers {
    const headers = new Headers();
    for (const [key, value] of Object.entries(headersObject)){
      headers.set(key, value as string);
    }
    return headers;
  }

  _getExpandedId(id: string, context: object) {
    return (context && Object.keys(context)) ? ContextParser.expandTerm(id, context) : id;
  }

  getExpandedPredicate(property: string, context: object) { return ContextParser.expandTerm(property, context, true) }

  _isLocalId(id: string) {
    return id.startsWith('store://local.');
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
    if (parentId && !parentId.startsWith('store://local')) { // and get full URL from parent caller for local files
      let parentIri = new URL(parentId, document.location.href).href;
      iri = new URL(iri, parentIri).href;
    } else {
      iri = new URL(iri, document.location.href).href;
    }
    return iri;
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