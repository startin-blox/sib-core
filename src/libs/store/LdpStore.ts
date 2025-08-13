import jsonld from 'jsonld';
import * as JSONLDContextParser from 'jsonld-context-parser';
import PubSub from 'pubsub-js';
import type { IStore, StoreConfig } from './IStore.ts';

import type { Resource } from '../../mixins/interfaces.ts';
import type { ServerSearchOptions } from './options/server-search.ts';
import { appendServerSearchToIri } from './options/server-search.ts';

import {
  doesResourceContainList,
  getRawContext,
  mergeContexts,
  normalizeContext,
} from '../helpers.ts';
import type { CacheManagerInterface } from './cache/cache-manager.ts';
import { InMemoryCacheManager } from './cache/in-memory.ts';
import type { ServerPaginationOptions } from './options/server-pagination.ts';
import { appendServerPaginationToIri } from './options/server-pagination.ts';

// Semantizer imports
import {
  EntryStreamTransformerDefaultImpl,
  indexFactory,
} from '@semantizer/mixin-index';
import { solidWebIdProfileFactory } from '@semantizer/mixin-solid-webid';
import type { DatasetSemantizer, NamedNode } from '@semantizer/types';
import {
  IndexQueryingStrategyShaclUsingFinalIndex,
  IndexStrategyFinalShapeDefaultImpl,
} from '@semantizer/util-index-querying-strategy-shacl-final';
import { ValidatorImpl } from '@semantizer/util-shacl-validator-default';
import N3 from 'n3';

// sib: 'http://cdn.startinblox.com/owl/ttl/vocab.ttl#',
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
  tems: 'https://cdn.startinblox.com/owl/tems.jsonld#',
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

export interface IndexQueryOptions {
  dataSrcProfile?: string;
  dataSrcIndex: string;
  dataRdfType: string;
  filterValues: Record<string, any>;
  exactMatchMapping?: Record<string, boolean>; // Mapping of property names to exact match flags
}

// New interface for conjunction queries
export interface ConjunctionQueryOptions {
  dataSrcProfile?: string;
  dataSrcIndex: string;
  dataRdfType: string;
  filterValues: Record<string, any>; // Multiple fields
  useConjunction?: boolean; // Flag to enable conjunction strategy
  exactMatchMapping?: Record<string, boolean>; // Mapping of property names to exact match flags
}

export interface IndexQueryResult {
  '@id': string;
  '@type': string;
}

export interface IndexQueryContainer {
  '@context': string;
  '@type': string;
  '@id': string;
  'ldp:contains': any[];
}

export class LdpStore implements IStore<Resource> {
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
   * Initialize the custom getter
   */
  async initGetter() {
    const { CustomGetter } = await import('./custom-getter.ts');
    return CustomGetter;
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
    context?: object | [],
    parentId?: string,
    localData?: object,
    forceFetch?: boolean,
    serverPagination?: ServerPaginationOptions,
    serverSearch?: ServerSearchOptions,
    headers?: object,
    bypassLoadingList?: boolean,
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

      if (!bypassLoadingList) {
        if (this.loadingList.has(key)) return;
        this.loadingList.add(key);
      }

      // Generate proxy
      let clientContext = await this.contextParser.parse(
        getRawContext(context),
      );

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
              headers,
            ));
        } catch (error) {
          console.error(id, error);
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

      const rawCtx = resource['@context'] || base_context;
      const normalizedRawContext: JSONLDContextParser.JsonLdContextNormalized =
        await this.contextParser.parse(
          Array.isArray(rawCtx) ? rawCtx : [rawCtx],
        );

      if (resource)
        clientContext = normalizeContext(
          mergeContexts(clientContext, normalizedRawContext),
        );

      const serverContext = await this.contextParser.parse([
        resource['@context'] || base_context,
      ]);

      // Cache proxy
      await this.cacheGraph(
        resource,
        clientContext,
        serverContext,
        parentId ? parentId : key,
        serverPagination,
        serverSearch,
      );
      this.loadingList.delete(key);
      const finalResource = await this.get(key);
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
    if (!this.fetch) {
      console.warn('No fetch method available');
    }

    // Check if the session is available
    // If not, wait for it to be available
    let authenticated = false;
    if (this.session) authenticated = await this.session;

    if (this.fetch && authenticated) {
      // authenticated
      return this.fetch.then(fn => {
        return fn(iri, options);
      });
    }

    // anonymous
    if (options.headers) {
      options.headers = this._convertHeaders(options.headers);
    }
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
    headers?: object,
  ) {
    let iri = this._getAbsoluteIri(id, context, parentId);
    if (serverPagination)
      iri = appendServerPaginationToIri(iri, serverPagination);
    if (serverSearch) iri = appendServerSearchToIri(iri, serverSearch);

    let requestHeaders = {
      ...this.headers,
      'accept-language': this._getLanguage(),
      // 'Prefer' : 'return=representation; max-triple-count="100"' // Commenting out for now as it raises CORS errors
    };

    // Add custom headers if provided
    if (headers) requestHeaders = { ...requestHeaders, ...headers };

    /**
     * Fetch data with authentication if available (sib-auth)
     * @param iri - iri to call
     * @param options - options of the request
     * @returns - response
     */
    return this.fetchAuthn(iri, {
      method: 'GET',
      headers: requestHeaders,
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
    const customGetter = await this.initGetter();
    await this.cache.linkUrlWithId(
      parentId,
      customGetter.getEmptyResource(
        resources['@id'],
        clientContext,
        parentContext,
      ) as any,
    );
    const flattenedResources: any = await jsonld.flatten(resources);
    const compactedResources: any[] = await Promise.all(
      flattenedResources.map(async r => jsonld.compact(await r, {})),
    );

    for (const resource of compactedResources) {
      const id = resource['@id'] || resource.id;
      let key = resource['@id'] || resource.id;

      if (!key) console.warn('No key or id for resource:', resource);
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

      const customGetter = await this.initGetter();
      const resourceProxy = new customGetter(
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
  async _fetch(
    method: string,
    resource: object,
    id: string,
    bypassLoadingList = false,
  ): Promise<any> {
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

    if (method === '_LOCAL' && bypassLoadingList)
      await this.getData(
        id,
        clientContext,
        '',
        resource,
        false,
        undefined,
        undefined,
        undefined,
        bypassLoadingList,
      );
    else await this.getData(id, clientContext, '', resource);

    return { ok: true };
  }

  /**
   * Subscribe all the children of a container to its parent
   * @param container
   */
  async subscribeChildren(container: any, containerId: string) {
    const children = await container['listPredicate'];
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
  async _updateResource(
    method: string,
    resource: object,
    id: string,
    skipFetch = false,
    bypassLoadingList = false,
  ) {
    if (!['POST', 'PUT', 'PATCH', '_LOCAL'].includes(method))
      throw new Error('Error: method not allowed');
    const context = await this.contextParser.parse([
      resource['@context'] || {},
    ]); // parse context before expandTerm
    const expandedId = this._getExpandedId(id, context);
    if (!expandedId) return null;
    return this._fetch(method, resource, id, bypassLoadingList).then(
      async response => {
        if (response.ok) {
          if (!skipFetch) {
            if (method !== '_LOCAL') {
              await this.clearCache(expandedId);
            } // clear cache
            // re-fetch data
            await this.getData(expandedId, resource['@context']);
            const nestedResources = await this.getNestedResources(resource, id);
            const resourcesToRefresh =
              this.subscriptionVirtualContainersIndex.get(expandedId) || [];
            const resourcesToNotify =
              this.subscriptionIndex.get(expandedId) || [];

            await this.refreshResources([
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
          }

          return response.headers?.get('Location') || null;
        }
        throw response;
      },
    );
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

  /**
   * Set data to create a local resource in a container
   * @param resource - resource to create
   * @param id - uri of the container to add resource. should start with ``
   *
   * @returns id of the posted resource
   */
  setLocalData(
    resource: object,
    id: string,
    skipFetch = false,
    bypassLoadingList = false,
  ): Promise<string | null> {
    return this._updateResource(
      '_LOCAL',
      resource,
      id,
      skipFetch,
      bypassLoadingList,
    );
  }

  /**
   * Send a POST request to create a resource in a container
   * @param resource - resource to create
   * @param id - uri of the container to add resource
   *
   * @returns id of the posted resource
   */
  post(
    resource: object,
    id: string,
    skipFetch = false,
  ): Promise<string | null> {
    return this._updateResource('POST', resource, id, skipFetch);
  }

  /**
   * Send a PUT request to edit a resource
   * @param resource - resource data to send
   * @param id - uri of the resource to edit
   *
   * @returns id of the edited resource
   */
  put(resource: object, id: string, skipFetch = false): Promise<string | null> {
    return this._updateResource('PUT', resource, id, skipFetch);
  }

  /**
   * Send a PATCH request to edit a resource
   * @param resource - resource data to send
   * @param id - uri of the resource to patch
   *
   * @returns id of the edited resource
   */
  async patch(
    resource: object,
    id: string,
    skipFetch = false,
  ): Promise<string | null> {
    return await this._updateResource('PATCH', resource, id, skipFetch);
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

  /**
   * Resolve a resource
   * @param id - id of the resource to resolve
   * @param resolve - callback function
   * @returns handler function
   */
  resolveResource = (id: string, resolve) => {
    const handler = event => {
      if (event.detail.id === id) {
        if (event.detail.resource) {
          resolve(event.detail.resource);
        } else {
          resolve(event.detail.fetchedResource);
        }
        // TODO : callback
        document.removeEventListener('resourceReady', handler);
      }
    };
    return handler;
  };

  /**
   * Validate if a string is a valid URL
   * @param url - The URL string to validate
   * @returns true if valid, false otherwise
   */
  private isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Query an index using SHACL shapes and return matching resources
   * @param options - Query options including data source, RDF type, and filter values
   * @returns Promise resolving to an array of matching resources
   */
  async queryIndex(options: IndexQueryOptions): Promise<any[]> {
    // Validate dataSrcIndex before proceeding
    if (!this.isValidUrl(options.dataSrcIndex)) {
      console.warn('⚠️ [Store.queryIndex] Invalid dataSrcIndex URL:', options.dataSrcIndex);
      return [];
    }

    console.log(
      '🔍 [Store.queryIndex] Starting query with options:',
      JSON.stringify(options, null, 2),
    );
    let indexDataset: DatasetSemantizer | undefined;

    // 0. Load the instance profile if defined
    if (options.dataSrcProfile) {
      console.log(
        '📋 [Store.queryIndex] Load application profile',
        options.dataSrcProfile,
      );
      const appIdProfile = await SEMANTIZER.load(
        options.dataSrcProfile,
        solidWebIdProfileFactory,
      );

      const appId = appIdProfile.loadExtendedProfile();
      if (!appId) {
        throw new Error('The WebId was not found.');
      }

      if (!indexDataset) {
        throw new Error('The meta-meta index was not found.');
      }
    } else if (options.dataSrcIndex) {
      // 1. Load the index directly
      console.log(
        '📂 [Store.queryIndex] Loading index from:',
        options.dataSrcIndex,
      );
      indexDataset = await SEMANTIZER.load(options.dataSrcIndex);
      console.log('✅ [Store.queryIndex] Index loaded successfully');
    }

    console.log(
      '🔍 [Store.queryIndex] Filter values:',
      JSON.stringify(options.filterValues, null, 2),
    );

    const filterFields = Object.entries(options.filterValues);
    console.log('🔍 [Store.queryIndex] Filter fields:', filterFields);

    const firstField = filterFields[0];
    const firstFieldValue = firstField[1] as { value: string };

    let path = firstField[0];
    let fieldName = path;

    // Handle nested paths (e.g., "nested.field")
    if (path.includes('.') && !path.includes(':')) {
      // Split the path on each dots
      const fieldPath: string[] = path.split('.');
      // Get last path
      path = fieldPath.pop() as string;
      fieldName = path.replace(/_([a-z])/g, g => g[1].toUpperCase());
    } else if (path.includes(':')) {
      // Handle prefixed URIs (e.g., "schema:location")
      fieldName = path; // Keep the full prefixed URI
    } else {
      // Handle simple field names
      fieldName = path.replace(/_([a-z])/g, g => g[1].toUpperCase());
    }

    const searchPattern = firstFieldValue.value as string;

    console.log('🔍 [Store.queryIndex] Parsed parameters:');
    console.log('  - Path:', path);
    console.log('  - Field name:', fieldName);
    console.log('  - Search pattern:', searchPattern);
    console.log('  - RDF type:', options.dataRdfType);
    console.log('  - Exact match mapping:', options.exactMatchMapping);

    // Generate shapes dynamically
    console.log('🔧 [Store.queryIndex] Generating SHACL shapes...');
    const { targetShape, subIndexShape, finalShape } = this.generateShapes(
      options.dataRdfType,
      fieldName,
      searchPattern,
      options.exactMatchMapping,
    );

    console.log('📝 [Store.queryIndex] Generated shapes:');
    console.log('=== TARGET SHAPE ===');
    console.log(targetShape);
    console.log('=== SUBINDEX SHAPE ===');
    console.log(subIndexShape);
    console.log('=== FINAL SHAPE ===');
    console.log(finalShape);

    const parser = new N3.Parser({ format: 'text/turtle' });
    const targetShapeGraph = SEMANTIZER.build();
    targetShapeGraph.addAll(parser.parse(targetShape));

    const finalIndexShapeGraph = SEMANTIZER.build();
    finalIndexShapeGraph.addAll(parser.parse(finalShape));

    const subIndexShapeGraph = SEMANTIZER.build();
    subIndexShapeGraph.addAll(parser.parse(subIndexShape));

    const shaclValidator = new ValidatorImpl();
    const entryTransformer = new EntryStreamTransformerDefaultImpl(SEMANTIZER);

    const finalIndexStrategy = new IndexStrategyFinalShapeDefaultImpl(
      finalIndexShapeGraph,
      subIndexShapeGraph,
      shaclValidator,
      entryTransformer,
    );
    const shaclStrategy = new IndexQueryingStrategyShaclUsingFinalIndex(
      targetShapeGraph,
      finalIndexStrategy,
      shaclValidator,
      entryTransformer,
    );

    console.log('🔧 [Store.queryIndex] Creating index with factory...');
    const index = await SEMANTIZER.load(options.dataSrcIndex, indexFactory);
    console.log('✅ [Store.queryIndex] Index created successfully');

    console.log('🚀 [Store.queryIndex] Starting query stream...');
    const resultStream = index.mixins.index.query(shaclStrategy);

    return new Promise<any[]>((resolve, reject) => {
      const resultIds: string[] = [];
      const resources: any[] = [];
      let pendingFetches = 0;
      let streamEnded = false;

      const checkComplete = () => {
        if (streamEnded && pendingFetches === 0) {
          console.log(
            `🏁 [Store.queryIndex] All resources fetched. Found ${resultIds.length} result IDs:`,
            resultIds,
          );
          console.log(
            `🎯 [Store.queryIndex] Returning ${resources.length} resources for ldp:contains`,
          );
          resolve(resources);
        }
      };

      resultStream.on('data', async (result: NamedNode) => {
        console.log('📦 [Store.queryIndex] Received result:', result.value);
        if (result.value) {
          resultIds.push(result.value);
          console.log('✅ [Store.queryIndex] Added result ID:', result.value);

          pendingFetches++;
          try {
            const resource = await this.getData(result.value);
            if (resource) {
              resources.push(resource);
              console.log(
                `✅ [Store.queryIndex] Successfully fetched resource: ${result.value}`,
              );
            } else {
              console.warn(
                `⚠️ [Store.queryIndex] Could not fetch resource: ${result.value}`,
              );
            }
          } catch (error) {
            console.error(
              `❌ [Store.queryIndex] Error fetching resource ${result.value}:`,
              error,
            );
          } finally {
            pendingFetches--;
            checkComplete();
          }
        }
      });

      resultStream.on('error', error => {
        console.error('❌ [Store.queryIndex] Error in index query:', error);
        reject(error);
      });

      resultStream.on('end', () => {
        console.log(
          `🏁 [Store.queryIndex] Stream ended. Found ${resultIds.length} result IDs:`,
          resultIds,
        );
        streamEnded = true;
        checkComplete();
      });
    });
  }

  /**
   * Query multiple fields and find intersection (conjunction) of results
   * @param options - Conjunction query options with multiple filter values
   * @returns Promise<any[]> - Array of matching resources that satisfy ALL criteria
   */
  async queryIndexConjunction(
    options: ConjunctionQueryOptions,
  ): Promise<any[]> {
    // Validate dataSrcIndex before proceeding
    if (!this.isValidUrl(options.dataSrcIndex)) {
      console.warn('⚠️ [Store.queryIndexConjunction] Invalid dataSrcIndex URL:', options.dataSrcIndex);
      return [];
    }

    console.log(
      '🔍 [Store.queryIndexConjunction] Starting conjunction query with options:',
      JSON.stringify(options, null, 2),
    );

    const filterFields = Object.entries(options.filterValues);
    console.log(
      '🔍 [Store.queryIndexConjunction] Filter fields:',
      filterFields,
    );

    if (filterFields.length === 0) {
      return [];
    }

    // Execute individual queries for each field
    const queryPromises = filterFields.map(([propertyName, filterValue]) => {
      const queryOptions: IndexQueryOptions = {
        dataSrcIndex: options.dataSrcIndex,
        dataRdfType: options.dataRdfType,
        filterValues: {
          [propertyName]: filterValue,
        },
        exactMatchMapping: options.exactMatchMapping,
      };

      console.log(
        `🔍 [Store.queryIndexConjunction] Executing query for ${propertyName}:`,
        queryOptions,
      );
      return this.queryIndex(queryOptions);
    });

    try {
      // Wait for all queries to complete
      const allResults = await Promise.all(queryPromises);
      console.log(
        '🔍 [Store.queryIndexConjunction] All individual queries completed',
      );

      // Find intersection (resources that appear in ALL result sets)
      if (allResults.length === 1) {
        return allResults[0];
      }

      // Get the first result set as the base
      const baseResults = allResults[0];
      // const baseIds = new Set(baseResults.map((r: any) => r['@id']));

      console.log(
        `🔍 [Store.queryIndexConjunction] Base results count: ${baseResults.length}`,
      );

      // Check which resources exist in ALL result sets
      const intersectionResults = baseResults.filter((resource: any) => {
        const resourceId = resource['@id'];
        console.log(
          `🔍 [Store.queryIndexConjunction] Checking resource: ${resourceId}`,
        );

        const existsInAllSets = allResults.every((resultSet, index) => {
          const found = resultSet.some((r: any) => r['@id'] === resourceId);
          console.log(
            `  - Set ${index}: ${found ? '✅' : '❌'} (${resultSet.length} items)`,
          );
          return found;
        });

        console.log(
          `  - Final result: ${existsInAllSets ? '✅ IN INTERSECTION' : '❌ NOT IN INTERSECTION'}`,
        );
        return existsInAllSets;
      });

      console.log(
        `🔍 [Store.queryIndexConjunction] Conjunction results count: ${intersectionResults.length}`,
      );
      return intersectionResults;
    } catch (error) {
      console.error(
        '❌ [Store.queryIndexConjunction] Error in conjunction query:',
        error,
      );
      throw error;
    }
  }

  /**
   * Generate SHACL shapes dynamically based on query parameters
   * @param rdfType - The RDF type to filter on
   * @param propertyName - The property name to search
   * @param pattern - The search pattern
   * @param exactMatchMapping - Optional mapping of property names to exact match flags (uses sh:hasValue instead of sh:pattern)
   * @returns Object containing target, subindex, and final shapes
   */
  private generateShapes(
    rdfType: string,
    propertyName: string,
    pattern: string,
    exactMatchMapping?: Record<string, boolean>,
  ) {
    console.log('🔧 [Store.generateShapes] Generating shapes with parameters:');
    console.log('  - RDF Type:', rdfType);
    console.log('  - Property Name:', propertyName);
    console.log('  - Pattern:', pattern);
    console.log('  - Exact Match Mapping:', exactMatchMapping);

    // Determine if this property should use exact matching
    const isExactMatch = exactMatchMapping && exactMatchMapping[propertyName];

    // For exact matching, use sh:pattern with case-insensitive regex for case-insensitive exact matching
    // This handles both case sensitivity and provides standard SHACL compliance
    // Note: Some SHACL engines may not support (?i) flags, so we use lowercase pattern
    // Try simple pattern matching without regex anchors for better compatibility
    let matchValue: string;
    if (isExactMatch) {
      // Exact match: use the pattern as-is, converted to lowercase
      matchValue = pattern.toLowerCase();
    } else {
      // Pattern match: extract meaningful prefix and add wildcard
      // Remove special characters and extract first few meaningful characters
      const cleanPattern = pattern
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
        .replace(/\s+/g, ' ')     // Normalize multiple spaces
        .trim();                  // Remove leading/trailing spaces

      // Extract first meaningful word (at least 3 characters)
      const words = cleanPattern.split(' ').filter(word => word.length >= 3);
      const prefix = words.length > 0 ? words[0].substring(0, 3) : pattern.substring(0, 3);

      matchValue = `${prefix}.*`;

      console.log('  - Cleaned pattern:', cleanPattern);
      console.log('  - Extracted words:', words);
      console.log('  - Generated prefix:', prefix);
    }

    const matchConstraint = 'sh:pattern';

    console.log('  - Is Exact Match:', isExactMatch);
    console.log('  - Match Value:', matchValue);
    console.log('  - Match Constraint:', matchConstraint);
    console.log(
      '  - Generated SHACL constraint: [ sh:path',
      matchConstraint + '; sh:hasValue "' + matchValue + '" ]',
    );
    const targetShape = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix idx: <https://ns.inria.fr/idx/terms#>.
@prefix sib: <https://cdn.startinblox.com/owl#>.
@prefix tems: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix tc: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix dcat: <http://www.w3.org/ns/dcat#>.
@prefix dct: <http://purl.org/dc/terms/>.

idx:IndexEntry
a rdfs:Class, sh:NodeShape ;
sh:closed false;
sh:property [
  sh:path idx:hasTarget;
    sh:minCount 1;
];
sh:property [
    sh:path idx:hasShape ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:property [
      sh:path sh:property ;
      sh:minCount 1;
        sh:qualifiedValueShape
            [
                sh:and (
                    [ sh:path sh:path ; sh:hasValue rdf:type ]
                    [ sh:path sh:hasValue; sh:hasValue ${rdfType} ]
                )
            ],
            [
                sh:and (
                    [ sh:path sh:path; sh:hasValue ${propertyName} ]
                    [ sh:path ${matchConstraint}; sh:hasValue "${matchValue}"  ]
                )
            ];
  sh:qualifiedMinCount 1 ;
    ];
].
`;

    const subIndexShape = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix idx: <https://ns.inria.fr/idx/terms#>.
@prefix sib: <https://cdn.startinblox.com/owl#>.
@prefix tems: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix tc: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix dcat: <http://www.w3.org/ns/dcat#>.
@prefix dct: <http://purl.org/dc/terms/>.

idx:IndexEntry
a rdfs:Class, sh:NodeShape ;
#sh:closed false;
sh:property [
    sh:path idx:hasSubIndex;
    sh:minCount 1;
];
sh:property [
    sh:path idx:hasShape ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:property [
        sh:path sh:property ;
        sh:minCount 1;
        sh:qualifiedValueShape
            [
                sh:and (
                    [ sh:path sh:path ; sh:hasValue rdf:type ]
                    [ sh:path sh:hasValue; sh:hasValue ${rdfType} ]
                )
            ],
            [
                sh:and (
                    [ sh:path sh:path; sh:hasValue ${propertyName} ]
                    [ sh:path sh:pattern ; sh:maxCount 0 ]
                )
            ];
        sh:qualifiedMinCount 1;
    ]
].`;

    const finalShape = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix idx: <https://ns.inria.fr/idx/terms#>.
@prefix sib: <https://cdn.startinblox.com/owl#>.
@prefix tems: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix tc: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix dcat: <http://www.w3.org/ns/dcat#>.
@prefix dct: <http://purl.org/dc/terms/>.

idx:IndexEntry
a rdfs:Class, sh:NodeShape ;
sh:closed false;
sh:property [
    sh:path idx:hasSubIndex;
    sh:minCount 1;
];
sh:property [
    sh:path idx:hasShape ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:property [
        sh:path sh:property ;
        sh:minCount 1;
        sh:qualifiedValueShape
            [
                sh:and (
                    [ sh:path sh:path ; sh:hasValue rdf:type ]
                    [ sh:path sh:hasValue; sh:hasValue ${rdfType} ]
                )
            ],
            [
                sh:and (
                    [ sh:path sh:path; sh:hasValue ${propertyName} ]
                    [ sh:path ${matchConstraint}; sh:hasValue "${matchValue}"  ]
                )
            ];
        sh:qualifiedMinCount 1 ;
    ];
].
`;

    return { targetShape, subIndexShape, finalShape };
  }
}

export function initLdpStore(_cfg?: StoreConfig): LdpStore {
  if (window.sibStore) {
    return window.sibStore;
  }

  const store = new LdpStore(_cfg?.options || {});
  window.sibStore = store;
  return store;
}

export class LdpStoreAdapter {
  private static store: IStore<any>;

  private constructor() {}

  public static getStoreInstance(_cfg?: StoreConfig): IStore<any> {
    if (!LdpStoreAdapter.store) {
      LdpStoreAdapter.store = initLdpStore(_cfg);
    }
    return LdpStoreAdapter.store;
  }
}
