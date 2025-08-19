
import {
  getRawContext,
  mergeContexts,
  normalizeContext,
} from '../../../helpers.ts';
import type { Resource } from '../../shared/types.ts';
import { StoreService } from '../../storeService.ts';
const store = StoreService.getInstance();

export class CustomGetter {
  resource: any; // content of the requested resource
  resourceId: string;
  clientContext: object; // context given by the app
  serverContext: object; // context given by the server
  parentId: string; // id of the parent resource, used to get the absolute url of the current resource
  listTypes: string[]; // types of resources interpreted as containers
  serverPagination: object; // pagination attributes to give to server
  serverSearch: object; // search attributes to give to server

  constructor(
    resourceId: string,
    resource: object,
    clientContext: object,
    serverContext: object,
    parentId = '',
    serverPagination: object = {},
    serverSearch: object = {},
  ) {
    this.clientContext = clientContext;
    this.serverContext = serverContext;
    this.parentId = parentId;
    this.resource = resource;
    this.resourceId = resourceId;
    this.serverPagination = serverPagination;
    this.serverSearch = serverSearch;

    this.listTypes = [
      this.getExpandedPredicate('ldp:Container'),
      this.getExpandedPredicate('dcat:Catalog'),
      this.getExpandedPredicate('ldp:BasicContainer'),
      this.getExpandedPredicate('ldp:DirectContainer'),
      this.getExpandedPredicate('ldp:IndirectContainer'),
      this.getExpandedPredicate('sib:federatedContainer'),
    ].filter(Boolean) as string[];
  }

  /**
   * Get the property of a resource for a given path
   * Which means that if the resource is not complete, it will fetch it
   * And that we handle the `.` notation, traversing the path recursively
   * @param path: string
   */
  async get(path: any) {
    if (!path) return;

    // Specific case where the predicates is a full IRI, avoid splitting it on the dot notation
    try {
      const isUrl = new URL(path);
      // My goal is to be able to solve user['circles.ldp:contains'] on the fly
      // If we do not check the url protocol, then it is considered valid
      if (!isUrl.protocol.startsWith('http'))
        throw new Error('Not a valid HTTP url');
      // If the path is a HTTP-scheme based URL, we need to fetch the resource directly
      if (isUrl) {
        let resources = await this.getList(path);
        if (!resources || (Array.isArray(resources) && resources.length === 0))
          return undefined;
        if (!Array.isArray(resources)) resources = [resources]; // convert to array if compacted to 1 resource

        const result = resources
          ? Promise.all(
              resources.map(async (res: object) => {
                let resource: any = await store.get(res['@id']);
                if (resource) return resource;

                // if not in cache, generate the basic resource
                resource = new CustomGetter(
                  res['@id'],
                  { '@id': res['@id'] },
                  this.clientContext,
                  this.serverContext,
                  this.parentId,
                ).getProxy();
                await store.cacheResource(res['@id'], resource); // put it in cache
                return resource; // and return it
              }),
            )
          : [];

        return result;
      }
    } catch {
      if (!path.split) return undefined;

      // Split the path on each dots
      const path1: string[] = path.split('.');

      // Intermediate path var to request each resource individually until the path traversal is completed
      const path2: string[] = [];

      // Actual value found from the store, if any
      let value: any;

      if (!this.isFullResource()) {
        // if resource is not complete, fetch it first
        await this.getResource(
          this.resourceId,
          { ...this.clientContext, ...this.serverContext },
          this.parentId,
        );
      }

      // If the path contains dot, we need to traverse the path recursively
      // We do that by poping one element from path1 at each step and affecting it to path2
      // Trying to get the value from it
      while (true) {
        // Try to get the value directly first, then fall back to getList for containers
        value = this.resource[path1[0]];
        if (!value) {
          const expandedPath = this.getExpandedPredicate(path1[0]);
          if (expandedPath) {
            value = this.resource[expandedPath];
          }
        }

        // If still no value, try getList (for container/array cases)
        if (!value) {
          value = await this.getList(path1[0]);
          if (Array.isArray(value) && value.length === 0) {
            value = undefined;
          }
        }

        if (path1.length <= 1) break; // no dot path
        const lastPath1El = path1.pop();
        if (lastPath1El) path2.unshift(lastPath1El);
      }

      if (path2.length === 0) {
        // end of the path
        if (!value || !value['@id']) return this.getLiteralValue(value); // no value or not a resource

        // Check if this is just a reference (like @type: @id properties) that shouldn't be fetched
        // If the object only has @id and optionally @type, handle it specially
        const valueKeys = Object.keys(value).filter(k => k !== '@type');
        if (valueKeys.length === 1 && valueKeys[0] === '@id') {
          // First check if it's already cached - if so, use the cached resource
          const cachedResource = await store.get(value['@id']);
          if (cachedResource) {
            return cachedResource;
          }

          // Try to determine if this is a @type: @id property by checking context
          try {
            const mergedContext = mergeContexts(
              this.clientContext,
              this.serverContext,
            );
            const rawContext = getRawContext(mergedContext);

            // Check both the compact and expanded forms of the path
            const pathsToCheck = [path];

            // Try to get the expanded form too if different from the compact form
            try {
              const expandedPath = this.getExpandedPredicate(path);
              if (expandedPath && expandedPath !== path) {
                pathsToCheck.push(expandedPath);
              }
            } catch (_expandError) {
              // Expansion failed, continue with just the original path
            }

            // Check if any form of the path is defined as @type: @id in context
            for (const pathToCheck of pathsToCheck) {
              if (
                rawContext?.[pathToCheck] &&
                typeof rawContext[pathToCheck] === 'object' &&
                rawContext[pathToCheck]['@type'] === '@id'
              ) {
                // This is a @type: @id property, return the string ID directly
                return value['@id'];
              }
            }
          } catch (error) {
            // If context parsing fails, continue with normal flow
            console.warn('Context parsing failed in CustomGetter:', error);
          }

          // If not explicitly @type: @id, try to fetch the resource
          try {
            const resource = await this.getResource(
              value['@id'],
              mergeContexts(this.clientContext, this.serverContext),
              this.parentId || this.resourceId,
            );

            // If resource was successfully fetched, return it
            if (resource !== null) {
              return resource;
            }
          } catch (fetchError) {
            // Resource fetch failed, fall back to returning the @id string
            console.warn('Failed to fetch resource:', value['@id'], fetchError);
          }

          // If resource couldn't be fetched or fetch failed, return the @id string directly
          // This handles cases where the context isn't available or the fetch fails
          return value['@id'];
        }

        return await this.getResource(
          value['@id'],
          mergeContexts(this.clientContext, this.serverContext),
          this.parentId || this.resourceId,
        ); // return complete resource
      }
      if (!value || !value['@id']) return undefined;

      const resource = await this.getResource(
        value['@id'],
        mergeContexts(this.clientContext, this.serverContext),
        this.parentId || this.resourceId,
      );
      store.subscribeResourceTo(this.resourceId, value['@id']);
      return resource ? await resource[path2.join('.')] : undefined; // return value
    }
  }

  static getEmptyResource(id: string, clientContext, parentContext) {
    return new CustomGetter(
      id,
      { '@id': id },
      clientContext,
      parentContext,
    ).getProxy();
  }

  /**
   * Return value depending of the current language
   * @param value
   * @returns
   */
  getLiteralValue(value: any): string | string[] | null {
    if (typeof value !== 'object' || value === null) return value;
    // value object: https://www.w3.org/TR/json-ld11/#value-objects
    if (value['@value']) return value['@value']; // 1 language
    if (!Array.isArray(value)) return value;
    if (value.length === 0) return null;
    if (!Array.isArray(value[0])) return value;

    // multiple languages
    const ln = store._getLanguage();
    let translatedValue = value.find(
      v => v['@language'] && v['@language'] === ln,
    ); // find current language
    if (!translatedValue)
      translatedValue = value.find(
        v => v['@language'] && v['@language'] === 'en',
      ); // default to en
    return translatedValue?.['@value'] ?? null; // return value when no translated value is found
  }

  /**
   * Cache resource in the store, and return the created proxy
   * @param id
   * @param context
   * @param iriParent
   */
  async getResource(
    id: string,
    context: object | [],
    iriParent: string,
    forceFetch = false,
  ) {
    if (id.startsWith('_:b')) return await store.get(id + iriParent); // anonymous node = get from cache
    return (await store.getData(
      id,
      context,
      iriParent,
      undefined,
      forceFetch,
    )) as Resource;
  }

  /**
   * Return true if the resource is a container
   */
  isContainer(): boolean {
    if (this.resource['@type']) {
      // @type is an array
      if (Array.isArray(this.resource['@type']))
        return this.listTypes.some(type =>
          this.resource['@type'].includes(type),
        );
      return this.listTypes.includes(this.resource['@type']);
    }
    if (!this.resource.type) return false;

    if (Array.isArray(this.resource.type))
      return this.listTypes.some(type => this.resource.type.includes(type));
    return this.listTypes.includes(this.resource.type);
  }

  /**
   * Return true if the given key in the current resource in an array
   */
  isArray(): boolean {
    if (Array.isArray(this.resource)) return true;

    return false;
  }

  /**
   * Get all properties of a resource
   */
  getProperties(): string[] {
    return Object.keys(this.resource).map(prop =>
      this.getCompactedPredicate(prop),
    );
  }

  /**
   * Get children of container as objects
   */
  async getList(predicateName: string): Promise<object[]> {
    let value = await this.resource[predicateName];

    if (!value) {
      const index = this.getExpandedPredicate(predicateName);
      if (index) {
        value = await this.resource[index];
      }
    }

    if (value === undefined || value === null) {
      return [];
    }
    return value;
  }

  async getListAndCacheIt(predicate: string): Promise<CustomGetter[] | null> {
    let children = await this.getList(predicate);
    if (!children) return null;

    if (!Array.isArray(children)) children = [children]; // convert to array if compacted to 1 resource

    const result = children
      ? await Promise.all(
          children.map(async (res: object) => {
            let resource: any = await store.get(res['@id']);
            if (resource) return resource;

            // if not in cache, generate the basic resource
            resource = new CustomGetter(
              res['@id'],
              { '@id': res['@id'] },
              this.clientContext,
              this.serverContext,
              this.parentId,
            ).getProxy();
            await store.cacheResource(res['@id'], resource); // put it in cache
            return resource; // and return it
          }),
        )
      : [];

    return result;
  }

  async getDcatDataset(): Promise<CustomGetter[] | null> {
    return await this.getListAndCacheIt('dcat:dataset');
  }

  /**
   * Get children of container as Proxys
   */
  async getLdpContains(): Promise<CustomGetter[] | null> {
    return await this.getListAndCacheIt('ldp:contains');
  }

  merge(resource: CustomGetter) {
    this.resource = {
      ...this.getResourceData(),
      ...resource.getResourceData(),
    };
  }

  getResourceData(): object {
    return this.resource;
  }

  /**
   * Get the list of resources associated with the list predicate of the resource
   * If the resource is a container, it will return the ldp:contains list
   * If the resource is a dcat:Catalog, it will return the dcat:dataset list
   * If the resource is not a container or a catalog, it will return null
   * @returns object[] | null
   */
  async getContainerList(): Promise<object[] | null> {
    if (this.hasType('ldp:Container')) {
      return await this.getLdpContains();
    }

    if (this.getType() === 'dcat:Catalog') {
      return await this.getDcatDataset();
    }

    return null;
  }

  /**
   * return true if resource seems complete
   * A resource is considered complete if it has at least one property which is not a permission
   */
  isFullResource(): boolean {
    const propertiesKeys = Object.keys(this.resource).filter(
      p => !p.startsWith('@'),
    );
    if (this.resource['@id'].startsWith('_:b')) return true; // anonymous node = considered as always full

    if (
      propertiesKeys.length === 1 &&
      propertiesKeys[0] === this.getExpandedPredicate('permissions')
    )
      return false;
    if (propertiesKeys.length > 0) return true;

    return false;
  }

  /**
   * Get permissions of a resource
   * @param resourceId
   * @returns
   */
  async getPermissions(): Promise<string[]> {
    const perms = this.getExpandedPredicate('permissions');
    if (!perms) return [];
    let permissions = this.resource[perms];
    if (!permissions) {
      // if no permission, re-fetch data from store
      await this.getResource(
        this.resourceId,
        { ...this.clientContext, ...this.serverContext },
        this.parentId,
        true,
      );
      permissions = this.resource[perms];
    }

    if (!Array.isArray(permissions)) permissions = [permissions]; // convert to array if compacted to 1 resource

    return permissions ? permissions : [];
  }

  /**
   * returns compacted @type of resource
   */
  getType(): string | string[] {
    // If type is an array, return an array of compacted types
    if (Array.isArray(this.resource['@type'])) {
      return this.resource['@type'].map(type => this.getCompactedIri(type));
    }
    return this.resource['@type']
      ? this.getCompactedIri(this.resource['@type'])
      : '';
  }

  /**
   * Check if the resource has a specific type
   * @param type
   */
  hasType(type: string): boolean {
    const types = this.getType();
    if (!types) return false;

    // If type is an array, check if the resource has the type in the array
    if (Array.isArray(types)) {
      return types.includes(this.getCompactedIri(type));
    }
    return types === this.getCompactedIri(type);
  }

  /**
   * Remove the resource from the cache
   */
  async clearCache(): Promise<void> {
    await store.clearCache(this.resourceId);
  }

  getExpandedPredicate(property: string) {
    const context = normalizeContext(
      mergeContexts(this.clientContext, this.serverContext),
    );
    return context.expandTerm(property, true);
  }
  getCompactedPredicate(property: string) {
    const context = normalizeContext(
      mergeContexts(this.clientContext, this.serverContext),
    );
    return context.compactIri(property, true);
  }
  getCompactedIri(id: string) {
    const context = normalizeContext(
      mergeContexts(this.clientContext, this.serverContext),
    );
    return context.compactIri(id);
  }
  toString() {
    return this.getCompactedIri(this.resource['@id']);
  }
  [Symbol.toPrimitive]() {
    return this.getCompactedIri(this.resource['@id']);
  }

  /**
   * Returns a Proxy which handles the different get requests
   */
  getProxy() {
    return new Proxy(this, {
      get: (resource, property) => {
        if (!this.resource) return undefined;
        if (typeof resource[property] === 'function')
          return resource[property].bind(resource);

        switch (property) {
          case '@id':
            if (this.resource['@id'])
              return this.getCompactedIri(this.resource['@id']);
            return;
          case '@type':
            return this.resource['@type']; // return synchronously
          case 'properties':
            return this.getProperties();
          case 'ldp:contains':
          case 'listPredicate':
            return this.getContainerList(); // returns standard arrays synchronously
          case 'permissions':
            return this.getPermissions(); // get expanded permissions
          case 'clientContext':
            return getRawContext(this.clientContext); // get saved client context to re-fetch easily a resource
          case 'serverContext':
            return getRawContext(this.serverContext); // get saved client context to re-fetch easily a resource
          case 'then':
            return;
          default:
            // FIXME: missing 'await'
            return resource.get(property);
        }
      },
    });
  }
}
