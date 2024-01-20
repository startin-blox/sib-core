import JSONLDContextParser from 'jsonld-context-parser';
import { store } from './store';
import type { Resource } from '../../mixins/interfaces';

const ContextParser = JSONLDContextParser.ContextParser;


export class CustomGetter {
    resource: any; // content of the requested resource
    resourceId: string;
    clientContext: object; // context given by the app
    serverContext: object; // context given by the server
    parentId: string; // id of the parent resource, used to get the absolute url of the current resource
    containerTypes: string[]; // types of resources interpreted as containers
    serverPagination: object; // pagination attributes to give to server
    serverSearch: object; // search attributes to give to server

    constructor(
        resourceId: string,
        resource: object,
        clientContext: object,
        serverContext: object,
        parentId: string = "",
        serverPagination: object = {},
        serverSearch: object = {}) {
        this.clientContext = clientContext;
        this.serverContext = serverContext;
        this.parentId = parentId;
        this.resource = resource;
        this.resourceId = resourceId;
        this.serverPagination = serverPagination;
        this.serverSearch = serverSearch;

        this.containerTypes = [
            this.getExpandedPredicate("ldp:Container"),
            this.getExpandedPredicate("ldp:BasicContainer"),
            this.getExpandedPredicate("ldp:DirectContainer"),
            this.getExpandedPredicate("ldp:IndirectContainer"),
            this.getExpandedPredicate("sib:federatedContainer"),
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
            let isUrl = new URL(path);
            // My goal is to be able to solve user['circles.ldp:contains'] on the fly
            // If we do not check the url protocol, then it is considered valid
            if (!isUrl.protocol.startsWith('http')) throw new Error('Not a valid HTTP url');
            // If the path is a HTTP-scheme based URL, we need to fetch the resource directly
            if (isUrl) {
                let value = this.resource[this.getExpandedPredicate(path)];
                return value ? value : undefined;
            }
        } catch (e) {
            // Split the path on each dots
            const path1: string[] = path.split('.');

            // Intermediate path var to request each resource individually until the path traversal is completed
            const path2: string[] = [];

            // Actual value found from the store, if any
            let value: any;

            if (!this.isFullResource()) { // if resource is not complete, fetch it first
                await this.getResource(this.resourceId, {...this.clientContext, ...this.serverContext}, this.parentId);
            }

            // If the path contains dot, we need to traverse the path recursively
            // We do that by poping one element from path1 at each step and affecting it to path2
            // Trying to get the value from it
            while (true) {
                try {
                    value = this.resource[this.getExpandedPredicate(path1[0])];
                } catch (e) { break }

                if (path1.length <= 1) break; // no dot path
                const lastPath1El = path1.pop();
                if(lastPath1El) path2.unshift(lastPath1El);
            }

            if (path2.length === 0) { // end of the path
                if (!value || !value['@id']) return this.getLiteralValue(value); // no value or not a resource
                return await this.getResource(value['@id'], {...this.clientContext, ...this.serverContext}, this.parentId || this.resourceId); // return complete resource
            }
            if (!value) return undefined;

            let resource = await this.getResource(value['@id'], {...this.clientContext, ...this.serverContext}, this.parentId || this.resourceId);
            store.subscribeResourceTo(this.resourceId, value['@id']);
            return resource ? await resource[path2.join('.')] : undefined; // return value
        }
    }

    /**
     * Return value depending of the current language
     * @param value
     * @returns
     */
    getLiteralValue(value: any): string|null {
        if (typeof value === "object") { // value object: https://www.w3.org/TR/json-ld11/#value-objects
            if (value['@value']) { // 1 language
                return value['@value'];
            } else if (Array.isArray(value)) { // multiple languages
                if (value.length === 0) return null;
                const ln = store._getLanguage();
                let translatedValue = value.find(v => v['@language'] && v['@language'] === ln); // find current language
                if (!translatedValue) translatedValue = value.find(v => v['@language'] && v['@language'] === 'en'); // default to en
                return translatedValue ? (translatedValue['@value'] || null) : null;
            }
        }
        return value; // simple value
    }


    /**
     * Cache resource in the store, and return the created proxy
     * @param id
     * @param context
     * @param iriParent
     */
    async getResource(id: string, context: object, iriParent: string, forceFetch: boolean = false): Promise<Resource | null> {
        if (id.startsWith('_:b')) return store.get(id + iriParent); // anonymous node = get from cache
        return store.getData(id, context, iriParent, undefined ,forceFetch);
    }


    /**
     * Return true if the resource is a container
     */
    isContainer(): boolean {
        if (this.resource["@type"]) { // @type is an array
            if (Array.isArray(this.resource["@type"]))
                return this.containerTypes.some(type => this.resource["@type"].includes(type));
            return this.containerTypes.includes(this.resource["@type"]);    
        } else if (this.resource["type"]) {
            if (Array.isArray(this.resource["type"]))
                return this.containerTypes.some(type => this.resource["type"].includes(type));
            return this.containerTypes.includes(this.resource["type"]);
        }

        return false;
    }

    /**
     * Return true if the given key in the current resource in an array
     */
    isArray(): boolean {
        if (Array.isArray(this.resource))
            return true;

        return false;
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
    getChildren(predicateName : string): object[] {
        return this.resource[this.getExpandedPredicate(predicateName)] || [];
    }

    /**
     * Get children of container as Proxys
     */
    getLdpContains(): CustomGetter[]|null {
        let children = this.resource[this.getExpandedPredicate("ldp:contains")];
        if (!children) return null;
        if (!Array.isArray(children)) children = [children]; // convert to array if compacted to 1 resource

        let result = children ? children.map((res: object) => {
            let resource: any = store.get(res['@id']);
            if (resource) return resource;

            // if not in cache, generate the basic resource
            resource = new CustomGetter(res['@id'], { '@id': res['@id'] }, this.clientContext, this.serverContext, this.parentId).getProxy()
            store.cacheResource(res['@id'], resource); // put it in cache
            return resource; // and return it
        }) : [];

        return result;
    }


    merge(resource: CustomGetter) {
        this.resource = { ...this.getResourceData(), ...resource.getResourceData() }
    }

    getResourceData(): object { return this.resource }

    /**
     * return true resource seems complete
     * @param prop
     */
    isFullResource(): boolean {
        return Object.keys(this.resource).filter(p => !p.startsWith('@')).length > 0 // has some properties
            || this.resource['@id'].startsWith('_:b'); // anonymous node = always full resource
    }

    /**
     * Get permissions of a resource
     * @param resourceId
     * @returns 
     */
    async getPermissions(): Promise<string[]> {
        let permissionsIds = this.resource[this.getExpandedPredicate("permissions")];
        if (!permissionsIds) { // if no permission, re-fetch data from store
            await this.getResource(this.resourceId, { ...this.clientContext, ...this.serverContext }, this.parentId, true);
            permissionsIds = this.resource[this.getExpandedPredicate("permissions")];
        }

        if (!permissionsIds) return [];

        if (!Array.isArray(permissionsIds)) permissionsIds = [permissionsIds]; // convert to array if compacted to 1 resource
        const permissions = await Promise.all(
          permissionsIds
            .map((p: string) => store.get(p['@id'] + this.parentId)) // get anonymous node from store
            .map((p: string) => p ? p['mode.@type'] : '')
        );
    
        return permissions ? permissions.map(
          perm => ContextParser.expandTerm((perm as string), this.serverContext, true)
        ) : [];
    }

    /**
     * returns compacted @type of resource
     */
    getType(): string {
        return this.resource['@type'] ? this.getCompactedIri(this.resource['@type']) : '';
    }

    /**
     * Remove the resource from the cache
     */
    clearCache(): void {
        store.clearCache(this.resourceId);
    }

    getExpandedPredicate(property: string) { return ContextParser.expandTerm(property, { ...this.clientContext, ...this.serverContext }, true) }
    getCompactedPredicate(property: string) { return ContextParser.compactIri(property, { ...this.clientContext, ...this.serverContext }, true) }
    getCompactedIri(id: string) { return ContextParser.compactIri(id, { ...this.clientContext, ...this.serverContext }) }
    toString() { return this.getCompactedIri(this.resource['@id']) }
    [Symbol.toPrimitive]() { return this.getCompactedIri(this.resource['@id']) }


    /**
     * Returns a Proxy which handles the different get requests
     */
    getProxy() {
        return new Proxy(this, {
            get: (resource, property) => {
                if (!this.resource) return undefined;
                if (typeof resource[property] === 'function') return resource[property].bind(resource);

                switch (property) {
                    case '@id':
                        if (this.resource['@id'])
                            return this.getCompactedIri(this.resource['@id']); // Compact @id if possible
                        else
                            console.log(this.resource, this.resource['@id']);
                        return;
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
                    case 'serverContext':
                        return this.serverContext; // get saved client context to re-fetch easily a resource
                    case 'then':
                        return;
                    default:
                        // FIXME: missing 'await'
                        return resource.get(property)
                }
            }
        })
    }
}