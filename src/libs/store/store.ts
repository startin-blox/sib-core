import * as JSONLDContextParser from 'jsonld-context-parser';
import PubSub from 'pubsub-js';

import jsonld from 'jsonld';
import { CustomGetter } from './custom-getter.ts';

import type { Resource } from '../../mixins/interfaces.ts';
import type { ServerSearchOptions } from './server-search.ts';
import { appendServerSearchToIri } from './server-search.ts';

import {
  doesResourceContainList,
  getRawContext,
  mergeContexts,
  normalizeContext,
} from '../helpers.ts';
import type { CacheManagerInterface } from './cache/cache-manager.ts';
import { InMemoryCacheManager } from './cache/in-memory.ts';
import type { ServerPaginationOptions } from './server-pagination.ts';
import { appendServerPaginationToIri } from './server-pagination.ts';

export const base_context = {
  '@vocab': 'https://cdn.startinblox.com/owl#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  doap: 'http://usefulinc.com/ns/doap#',
  ldp: 'http://www.w3.org/ns/ldp#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
  acl: 'http://www.w3.org/ns/auth/acl#',
  hd: 'http://cdn.startinblox.com/owl/ttl/vocab.ttl#',
  sib: 'http://cdn.startinblox.com/owl/ttl/vocab.ttl#',
  dcat: 'https://www.w3.org/ns/dcat3.jsonld#',
  name: 'rdfs:label',
  deadline: 'xsd:dateTime',
  lat: 'geo:lat',
  lng: 'geo:long',
  jabberID: 'foaf:jabberID',
  permissions: 'acl:accessControl',
  mode: 'acl:mode',
  view: 'acl:Read',
  change: 'acl:Write',
  add: 'acl:Append',
  delete: 'acl:Delete',
  control: 'acl:Control',
};

export class Store {
  cache: CacheManagerInterface;
  subscriptionIndex: Map<string, any>; // index of all the containers per resource
  subscriptionVirtualContainersIndex: Map<string, any>; // index of all the containers per resource
  loadingList: Set<string>;
  headers: object;
  fetch: Promise<any> | undefined;
  session: Promise<any> | undefined;
  contextParser: JSONLDContextParser.ContextParser;

  constructor(private storeOptions: StoreOptions) {
    this.cache = this.storeOptions.cacheManager ?? new InMemoryCacheManager();
    this.subscriptionIndex = new Map();
    this.subscriptionVirtualContainersIndex = new Map();
    this.loadingList = new Set();
    this.headers = {
      Accept: 'application/ld+json',
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'must-revalidate',
    };
    this.fetch = this.storeOptions.fetchMethod;
    this.session = this.storeOptions.session;
    this.contextParser = new JSONLDContextParser.ContextParser();
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
    context: object | [] = [],
    parentId = '',
    localData?: object,
    forceFetch = false,
    serverPagination?: ServerPaginationOptions,
    serverSearch?: ServerSearchOptions,
  ): Promise<Resource | null> {
    let key = id;
    if (serverPagination) {
      key = appendServerPaginationToIri(key, serverPagination);
    }

    if (serverSearch) {
      key = appendServerSearchToIri(key, serverSearch);
    }
    if (
      localData == null &&
      (await this.cache.has(key)) &&
      !this.loadingList.has(key)
    ) {
      const resource = await this.get(key);
      if (resource?.isFullResource?.() && !forceFetch) return await resource; // if resource is not complete, re-fetch it
    }
    return new Promise(async resolve => {
      document.addEventListener(
        'resourceReady',
        this.resolveResource(key, resolve),
      );

      if (this.loadingList.has(key)) return;
      this.loadingList.add(key);

      // Generate proxy
      let clientContext = await this.contextParser.parse(
        getRawContext(context),
      );
      // if (id === "https://ldp-server.test/users/") debugger;

      let resource: any = null;
      if (this._isLocalId(id)) {
        if (localData == null) localData = {};
        localData['@id'] = id;
        resource = localData;
      } else
        try {
          resource =
            localData ||
            (await this.fetchData(
              id,
              clientContext,
              parentId,
              serverPagination,
              serverSearch,
            ));
          // if (id === "https://ldp-server.test/users/") debugger;
        } catch (error) {
          console.error(error);
        }
      if (!resource) {
        this.loadingList.delete(key);
        document.dispatchEvent(
          new CustomEvent('resourceReady', {
            detail: { id: key, resource: null, fetchedResource: null },
          }),
        );
        return;
      }

      console.log('Fetched resource without normalized context:', id, resource);

      const rawCtx = resource['@context'] || base_context;
      const normalizedRawContext: JSONLDContextParser.JsonLdContextNormalized =
        await this.contextParser.parse(
          Array.isArray(rawCtx) ? rawCtx : [rawCtx],
        );
      // if (id === "https://ldp-server.test/users/") debugger;

      if (resource)
        clientContext = normalizeContext(
          mergeContexts(clientContext, normalizedRawContext),
        );

      const serverContext = await this.contextParser.parse([
        resource['@context'] || base_context,
      ]);
      // if (id === "https://ldp-server.test/users/") debugger;
      console.log('Fetched resource with normalized context:', id, resource);

      // Cache proxy
      await this.cacheGraph(
        resource,
        clientContext,
        serverContext,
        parentId ? parentId : key,
        serverPagination,
        serverSearch,
      );
      // if (id === "https://ldp-server.test/users/") debugger;
      this.loadingList.delete(key);
      const finalResource = await this.get(key);
      // if (id === "https://ldp-server.test/users/") debugger;
      console.log('--------------- resource:', resource);
      console.log('---------------Final resource:', finalResource);
      document.dispatchEvent(
        new CustomEvent('resourceReady', {
          detail: {
            id: key,
            resource: finalResource,
            fetchedResource: resource,
          },
        }),
      );
    });
  }

  async fetchAuthn(iri: string, options: any) {
    let authenticated = false;
    if (this.session) authenticated = await this.session;

    if (this.fetch && authenticated) {
      // authenticated
      return this.fetch.then(fn => fn(iri, options));
    }
    // anonymous
    if (options.headers)
      options.headers = this._convertHeaders(options.headers);
    return fetch(iri, options).then(response => response);
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
    context: JSONLDContextParser.JsonLdContextNormalized | null = null,
    parentId = '',
    serverPagination?: ServerPaginationOptions,
    serverSearch?: ServerSearchOptions,
  ) {
    let iri = this._getAbsoluteIri(id, context, parentId);
    if (serverPagination)
      iri = appendServerPaginationToIri(iri, serverPagination);
    if (serverSearch) iri = appendServerSearchToIri(iri, serverSearch);

    const headers = {
      ...this.headers,
      'accept-language': this._getLanguage(),
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
      credentials: 'include',
    }).then(response => {
      if (!response.ok) return;
      return response.json();
    });
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
    resources: any,
    clientContext: JSONLDContextParser.JsonLdContextNormalized,
    parentContext: object,
    parentId: string,
    serverPagination?: ServerPaginationOptions,
    serverSearch?: ServerSearchOptions,
  ) {
    // Flatten and compact the graph, which is an issue with large containers having child permissions serialized
    // Because
    // That strategy cannot work for containers
    // As we loose the capability to apply the proper parentId to the permissions blank nodes which are moved
    // At top level of the graph
    // So either we do not modify the key of the blank nodes to force them into the cache
    // Either we modify it by adding the parentId and we end up with
    // a lot of cached permissions objects associated with the container top resource (like xxxxx/circles/)
    await this.cache.linkUrlWithId(
      parentId,
      CustomGetter.getEmptyResource(
        resources['@id'],
        clientContext,
        parentContext,
      ) as any,
    );
    console.log('Cache empty resource for', parentId, resources['@id']);
    console.log('Cache empty resource for', parentId, resources);

    const flattenedResources: any = await jsonld.flatten(resources);
    console.log('Flattened resource:', flattenedResources);

    const compactedResources: any[] = await Promise.all(
      flattenedResources.map(async r => jsonld.compact(await r, {})),
    );

    console.log('Compacted resource:', compactedResources);
    for (const resource of compactedResources) {
      console.log('Cache resource:', resource);
      const id = resource['@id'] || resource.id;
      let key = resource['@id'] || resource.id;

      if (!key) console.log('No key or id for resource:', resource);
      if (key === '/') key = parentId;
      if (key.startsWith('_:b')) key = key + parentId; // anonymous node -> store in cache with parentId not being a container resourceId
      // But how to handle the case where the parent is a container, we need its permissions in the cache !
      // Or maybe for containers we should refetch and only get the permissions nodes without flattening the whole container ?
      // Using a dedicated method in the custom-getter.

      // We have to add the server search and pagination attributes again here to the resource cache key
      if (
        (key === id &&
          resource['@type'] ===
            this.getExpandedPredicate('ldp:Container', clientContext)) ||
        resource['@type'] ===
          this.getExpandedPredicate('dcat:Catalog', clientContext)
      ) {
        // Add only pagination and search params to the original resource
        if (serverPagination)
          key = appendServerPaginationToIri(key, serverPagination);
        if (serverSearch) key = appendServerSearchToIri(key, serverSearch);
      }

      const resourceProxy = new CustomGetter(
        key,
        resource,
        clientContext,
        parentContext,
        parentId,
        serverPagination,
        serverSearch,
      ).getProxy();
      if (resourceProxy.isContainer())
        await this.subscribeChildren(resourceProxy, id);

      if (await this.get(key)) {
        // if already cached, merge data
        // await this.cache.get(key)?.merge(resourceProxy);
        const resourceFromCache = await this.cache.get(key);

        // if (key === "https://ldp-server.test/users/") debugger;

        if (resourceFromCache) {
          resourceFromCache.merge(resourceProxy);
        }
      } else {
        // else, put in cache
        await this.cacheResource(key, resourceProxy);
      }
    }
  }

  /**
   * Put proxy in cache
   * @param key
   * @param resourceProxy
   */
  async cacheResource(key: string, resourceProxy: any) {
    await this.cache.set(key, resourceProxy);
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
        credentials: 'include',
      });

    const resourceProxy = await this.get(id);
    const clientContext = resourceProxy
      ? mergeContexts(resourceProxy.clientContext, resource['@context'])
      : resource['@context'];

    await this.clearCache(id);
    console.debug('Actually fetching data for', id, resource);
    await this.getData(id, clientContext, '', resource, true);

    return { ok: true };
  }

  /**
   * Subscribe all the children of a container to its parent
   * @param container
   */
  async subscribeChildren(container: CustomGetter, containerId: string) {
    const children = await container['listPredicate'];
    console.log('---------------subscribeChildren', containerId, children);
    if (!children) return;

    for (const res of children) {
      this.subscribeResourceTo(containerId, res['@id'] || (res as any).id);
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
    if (!['POST', 'PUT', 'PATCH', '_LOCAL'].includes(method))
      throw new Error('Error: method not allowed');
    const context = await this.contextParser.parse([
      resource['@context'] || {},
    ]); // parse context before expandTerm
    const expandedId = this._getExpandedId(id, context);
    if (!expandedId) return null;
    return this._fetch(method, resource, id).then(async response => {
      if (response.ok) {
        if (method !== '_LOCAL') {
          await this.clearCache(expandedId);
        } // clear cache
        this.getData(expandedId, resource['@context']).then(async () => {
          // re-fetch data
          const nestedResources = await this.getNestedResources(resource, id);
          const resourcesToRefresh =
            this.subscriptionVirtualContainersIndex.get(expandedId) || [];
          const resourcesToNotify =
            this.subscriptionIndex.get(expandedId) || [];

          return this.refreshResources([
            ...nestedResources,
            ...resourcesToRefresh,
          ]) // refresh related resources
            .then(resourceIds =>
              this.notifyResources([
                expandedId,
                ...resourceIds,
                ...resourcesToNotify,
              ]),
            ); // notify components
        });
        return response.headers?.get('Location') || null;
      }
      throw response;
    });
  }

  /**
   * Clear cache and refetch data for a list of ids
   * @param resourceIds -
   * @returns - all the resource ids
   */
  async refreshResources(resourceIds: string[]) {
    const uniqueIds = Array.from(new Set(resourceIds));
    const maybe = await Promise.all(
      uniqueIds.map(
        async id => await this.cache.has(id).then(ok => (ok ? id : null)),
      ),
    );
    resourceIds = maybe.filter((id): id is string => id !== null);

    const resourceWithContexts = await Promise.all(
      resourceIds.map(async resourceId => {
        const res = await this.get(resourceId);
        return {
          id: resourceId,
          context: res?.clientContext,
        };
      }),
    );

    for (const resource of resourceWithContexts) {
      if (!this._isLocalId(resource.id)) await this.clearCache(resource.id);
    }

    await Promise.all(
      resourceWithContexts.map(async ({ id, context }) => {
        await this.getData(id, context || base_context);
      }),
    );
    return resourceIds;
  }

  /**
   * Notifies all components for a list of ids
   * @param resourceIds -
   */
  notifyResources(resourceIds: string[]) {
    resourceIds = [...new Set(resourceIds)]; // remove duplicates
    console.log('--------------Notify resources:', resourceIds);
    for (const id of resourceIds) PubSub.publish(id);
  }

  /**
   * Return id of nested properties of a resource
   * @param resource - object
   * @param id - string
   */
  async getNestedResources(resource: object, id: string) {
    const cachedResource = await this.get(id);
    if (!cachedResource || cachedResource.isContainer?.()) return [];
    const nestedProperties: any[] = [];
    const excludeKeys = ['@context'];
    for (const p of Object.keys(resource)) {
      if (
        resource[p] &&
        typeof resource[p] === 'object' &&
        !excludeKeys.includes(p) &&
        resource[p]['@id']
      ) {
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
  async get(
    id: string,
    serverPagination?: ServerPaginationOptions,
    serverSearch?: ServerSearchOptions,
  ): Promise<Resource | null> {
    if (serverPagination) {
      id = appendServerPaginationToIri(id, serverPagination);
    }

    if (serverSearch) {
      id = appendServerSearchToIri(id, serverSearch);
    }

    const resource = (await this.cache.get(id)) || null;
    console.log('[store] Get resource:', id, resource);
    return resource;
  }

  /**
   * Removes a resource from the cache
   * @param id - id of the resource to remove from the cache
   */
  async clearCache(id: string): Promise<void> {
    if (await this.cache.has(id)) {
      // For federation, clear each source
      const resource = await this.cache.get(id);
      const predicate = resource ? await resource['listPredicate'] : null;
      if (predicate) {
        for (const child of predicate) {
          if (child?.['@type'] && doesResourceContainList(child))
            await this.cache.delete(child['@id']);
        }
      }

      await this.cache.delete(id);
    }
  }

  async clear(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Send data to create a local resource in a container
   * @param resource - resource to create
   * @param id - uri of the container to add resource. should start with ``
   *
   * @returns id of the posted resource
   */
  setLocalData(resource: object, id: string): Promise<string | null> {
    return this._updateResource('_LOCAL', resource, id);
  }

  /**
   * Send a POST request to create a resource in a container
   * @param resource - resource to create
   * @param id - uri of the container to add resource
   *
   * @returns id of the posted resource
   */
  post(resource: object, id: string): Promise<string | null> {
    return this._updateResource('POST', resource, id);
  }

  /**
   * Send a PUT request to edit a resource
   * @param resource - resource data to send
   * @param id - uri of the resource to edit
   *
   * @returns id of the edited resource
   */
  put(resource: object, id: string): Promise<string | null> {
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
    return await this._updateResource('PATCH', resource, id);
  }

  /**
   * Send a DELETE request to delete a resource
   * @param id - uri of the resource to delete
   * @param context - can be used to expand id
   *
   * @returns id of the deleted resource
   */
  async delete(
    id: string,
    context: JSONLDContextParser.JsonLdContextNormalized | null = null,
  ) {
    const expandedId = this._getExpandedId(id, context);
    if (!expandedId) return null;
    const deleted = await this.fetchAuthn(expandedId, {
      method: 'DELETE',
      headers: this.headers,
      credentials: 'include',
    });

    const resourcesToNotify = this.subscriptionIndex.get(expandedId) || [];
    const resourcesToRefresh =
      this.subscriptionVirtualContainersIndex.get(expandedId) || [];

    this.refreshResources([...resourcesToNotify, ...resourcesToRefresh]).then(
      resourceIds => this.notifyResources(resourceIds),
    );

    return deleted;
  }

  /**
   * Convert headers object to Headers
   * @param headersObject - object
   * @returns {Headers}
   */
  _convertHeaders(headersObject: object): Headers {
    const headers = new Headers();
    for (const [key, value] of Object.entries(headersObject)) {
      headers.set(key, value as string);
    }
    return headers;
  }

  _getExpandedId(
    id: string,
    context: JSONLDContextParser.JsonLdContextNormalized | null,
  ) {
    if (!context || Object.keys(context).length === 0) return id;
    return normalizeContext(context).expandTerm(id);
  }

  /**
   * Returns the expanded predicate based on provided context or the base one.
   * @param property The property to expand
   * @param context Your current context
   * @returns The fully expanded term
   */
  getExpandedPredicate(
    property: string,
    context: JSONLDContextParser.JsonLdContextNormalized | null,
  ) {
    return normalizeContext(context, base_context).expandTerm(property, true);
  }

  /**
   * Returns the compacted IRI based on provided context or the base one.
   * @param property The property to compact
   * @param context Your current context
   * @returns The compacted term
   */
  getCompactedIri(
    property: string,
    context: JSONLDContextParser.JsonLdContextNormalized | null,
  ) {
    return normalizeContext(context, base_context).compactIri(property, true);
  }

  /**
   * Check if the id is a local id
   * @param id - string
   * @returns boolean
   */
  _isLocalId(id: string) {
    return id?.startsWith('store://local.');
  }

  /**
   * Make a resource listen changes of another one
   * @param resourceId - id of the resource which needs to be updated
   * @param nestedResourceId - id of the resource which will change
   */
  subscribeResourceTo(resourceId: string, nestedResourceId: string) {
    const existingSubscriptions =
      this.subscriptionIndex.get(nestedResourceId) || [];
    this.subscriptionIndex.set(nestedResourceId, [
      ...new Set([...existingSubscriptions, resourceId]),
    ]);
  }

  /**
   * Make a virtual container listen for changes of a resource
   * @param virtualContainerId - id of the container which needs to be updated
   * @param nestedResourceId - id of the resource which will change
   */
  subscribeVirtualContainerTo(
    virtualContainerId: string,
    nestedResourceId: string,
  ) {
    const existingSubscriptions =
      this.subscriptionVirtualContainersIndex.get(nestedResourceId) || [];
    this.subscriptionVirtualContainersIndex.set(nestedResourceId, [
      ...new Set([...existingSubscriptions, virtualContainerId]),
    ]);
  }

  /**
   * Return absolute IRI of the resource
   * @param id
   * @param context
   * @param parentId
   */
  _getAbsoluteIri(
    id: string,
    context: JSONLDContextParser.JsonLdContextNormalized | null,
    parentId: string,
  ): string {
    let iri = normalizeContext(context, base_context).expandTerm(id); // expand if reduced ids
    if (!iri) return '';
    if (parentId && !parentId.startsWith('store://local')) {
      // and get full URL from parent caller for local files
      const parentIri = new URL(parentId, document.location.href).href;
      iri = new URL(iri, parentIri).href;
    } else {
      iri = new URL(iri, document.location.href).href;
    }
    return iri;
  }

  /**
   * Return the user session information
   */
  async getSession() {
    return await this.session;
  }

  /**
   * Return language of the users
   */
  _getLanguage() {
    return (
      localStorage.getItem('language') || window.navigator.language.slice(0, 2)
    );
  }

  /**
   * Save the preferred language of the user
   * @param selectedLanguageCode
   */
  selectLanguage(selectedLanguageCode: string) {
    localStorage.setItem('language', selectedLanguageCode);
  }

  resolveResource = (id: string, resolve) => {
    const handler = event => {
      if (event.detail.id === id) {
        if (event.detail.resource) {
          console.log('--------------resolving resource');
          resolve(event.detail.resource);
        } else {
          console.log('--------------resolving fetchedResource');
          resolve(event.detail.fetchedResource);
        }
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
  const storeOptions: StoreOptions = {};

  if (sibAuth) {
    const sibAuthDefined = customElements.whenDefined(sibAuth.localName);
    storeOptions.session = sibAuthDefined.then(() => (sibAuth as any).session);
    storeOptions.fetchMethod = sibAuthDefined.then(() =>
      (sibAuth as any).getFetch(),
    );
  }

  store = new Store(storeOptions);
  window.sibStore = store;
}

export { store };
