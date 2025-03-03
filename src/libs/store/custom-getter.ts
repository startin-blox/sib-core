import JSONLDContextParser from 'jsonld-context-parser';
import type { Resource } from '../../mixins/interfaces.ts';
import { doesResourceContainPredicate } from '../helpers.ts';
import { store } from './store.ts';

const ContextParser = JSONLDContextParser.ContextParser;

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
    ];
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
        let resources = this.getChildren(path);
        if (!resources || (Array.isArray(resources) && resources.length === 0))
          return undefined;
        if (!Array.isArray(resources)) resources = [resources]; // convert to array if compacted to 1 resource

        const result = resources
          ? resources.map((res: object) => {
              let resource: any = store.get(res['@id']);
              if (resource) return resource;

              // if not in cache, generate the basic resource
              resource = new CustomGetter(
                res['@id'],
                { '@id': res['@id'] },
                this.clientContext,
                this.serverContext,
                this.parentId,
              ).getProxy();
              store.cacheResource(res['@id'], resource); // put it in cache
              return resource; // and return it
            })
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
        value = await this.getChildren(path1[0]);

        if (path1.length <= 1) break; // no dot path
        const lastPath1El = path1.pop();
        if (lastPath1El) path2.unshift(lastPath1El);
      }

      if (path2.length === 0) {
        // end of the path
        if (!value || !value['@id']) return this.getLiteralValue(value); // no value or not a resource
        return await this.getResource(
          value['@id'],
          { ...this.clientContext, ...this.serverContext },
          this.parentId || this.resourceId,
        ); // return complete resource
      }
      if (!value || !value['@id']) return undefined;

      const resource = await this.getResource(
        value['@id'],
        { ...this.clientContext, ...this.serverContext },
        this.parentId || this.resourceId,
      );
      store.subscribeResourceTo(this.resourceId, value['@id']);
      return resource ? await resource[path2.join('.')] : undefined; // return value
    }
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
    context: object,
    iriParent: string,
    forceFetch = false,
  ): Promise<Resource | null> {
    if (id.startsWith('_:b')) return await store.get(id + iriParent); // anonymous node = get from cache
    return store.getData(id, context, iriParent, undefined, forceFetch);
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
      return this.listTypes.some(type =>
        this.resource.type.includes(type),
      );
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
  getChildren(predicateName: string): object[] {
    let value = this.resource[predicateName];

    if (!value) {
      value = this.resource[this.getExpandedPredicate(predicateName)];
    }

    if (value === undefined || value === null) {
      return [];
    }
    return value;
  }

  getChildrenAndCache(predicate: string): CustomGetter[] | null {
    let children = this.getChildren(predicate);
    if (!children) return null;

    if (!Array.isArray(children)) children = [children]; // Ensure array format

    const result = children
      ? children.map((res: object) => {
          let resource: any = store.get(res['@id']);
          if (resource) return resource;

          // if not in cache, generate the basic resource
          resource = new CustomGetter(
            res['@id'],
            { '@id': res['@id'] },
            this.clientContext,
            this.serverContext,
            this.parentId,
          ).getProxy();
          store.cacheResource(res['@id'], resource); // put it in cache
          return resource; // and return it
        })
      : [];

    return result;
  }

  getDcatDataset(): CustomGetter[] | null {
    return this.getChildrenAndCache('dcat:dataset');
  }

  /**
   * Get children of container as Proxys
   */
  getLdpContains(): CustomGetter[] | null {
    return this.getChildrenAndCache('ldp:contains');
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

  hasContainerPredicate(): boolean {
    return doesResourceContainPredicate(this.resource, {
      ...this.clientContext,
      ...this.serverContext,
    });
  }

  getContainerPredicate(): object[] | null {
    if (this.getType() === 'ldp:Container') {
      return this.getLdpContains();
    }

    if (this.getType() === 'dcat:Catalog') {
      return this.getDcatDataset();
    }

    return [];
  }

  /**
   * return true resource seems complete
   * @param prop
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
    let permissions = this.getChildren('permissions').map(p => String(p));

    if (!permissions) {
      // if no permission, re-fetch data from store
      await this.getResource(
        this.resourceId,
        { ...this.clientContext, ...this.serverContext },
        this.parentId,
        true,
      );
      permissions = this.getChildren('permissions').map(p => String(p));
    }

    if (!Array.isArray(permissions)) permissions = [permissions]; // convert to array if compacted to 1 resource

    return permissions ? permissions : [];
  }

  /**
   * returns compacted @type of resource
   */
  getType(): string {
    return this.resource['@type']
      ? this.getCompactedIri(this.resource['@type'])
      : '';
  }

  /**
   * Remove the resource from the cache
   */
  clearCache(): void {
    store.clearCache(this.resourceId);
  }

  getExpandedPredicate(property: string) {
    return ContextParser.expandTerm(
      property,
      { ...this.clientContext, ...this.serverContext },
      true,
    );
  }
  getCompactedPredicate(property: string) {
    return ContextParser.compactIri(
      property,
      { ...this.clientContext, ...this.serverContext },
      true,
    );
  }
  getCompactedIri(id: string) {
    return ContextParser.compactIri(id, {
      ...this.clientContext,
      ...this.serverContext,
    });
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
            console.log(this.resource, this.resource['@id']);
            return;
          case '@type':
            return this.resource['@type']; // return synchronously
          case 'properties':
            return this.getProperties();
          case 'predicate':
            return this.getContainerPredicate(); // returns standard arrays synchronously
          case 'permissions':
            return this.getPermissions(); // get expanded permissions
          case 'clientContext':
            return this.clientContext; // get saved client context to re-fetch easily a resource
          case 'serverContext':
            return this.serverContext; // get saved client context to re-fetch easily a resource
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
