# Store API Documentation

The StartinBlox Store is a powerful data management layer that handles Linked Data Platform (LDP) resources with support for JSON-LD, caching, querying, and federation. This document provides comprehensive documentation for all public store methods and classes.

## Table of Contents

- [Getting Started](#getting-started)
- [StoreService](#storeservice)
- [Core Store Methods](#core-store-methods)
  - [Data Retrieval](#data-retrieval)
  - [Data Manipulation](#data-manipulation)
  - [Cache Management](#cache-management)
  - [Language Support](#language-support)
  - [Advanced Querying](#advanced-querying)
- [Configuration](#configuration)
- [Interfaces and Types](#interfaces-and-types)
- [Examples](#examples)

## Getting Started

The store can be accessed through the global `StoreService` singleton or by creating store instances directly.

```javascript
import { StoreService } from '@startinblox/core';

// Get the singleton instance (creates default LDP store if not initialized)
const store = StoreService.getInstance();

// Or initialize with custom configuration
StoreService.init({
  type: StoreType.LDP,
  options: {
    cacheManager: new InMemoryCacheManager()
  }
});
```

## StoreService

### Static Methods

#### `init(config?: StoreConfig): void`

Initialize the store service with a specific configuration. Should be called once at application startup.

**Parameters:**
- `config` (optional): Store configuration object

```javascript
import { StoreService, StoreType } from '@startinblox/core';

StoreService.init({
  type: StoreType.LDP,
  options: {
    fetchMethod: customFetch,
    session: authSession
  }
});
```

#### `getInstance(): IStore<any>`

Get the current store instance. Creates a default LDP store if none exists.

**Returns:** The current store instance

```javascript
const store = StoreService.getInstance();
```

#### `getConfig(): StoreConfig | null`

Get the current store configuration.

**Returns:** The current store configuration or null if not set

## Core Store Methods

### Data Retrieval

#### `getData(id: string, context?: object | [], parentId?: string, localData?: object, forceFetch?: boolean, serverPagination?: ServerPaginationOptions, serverSearch?: ServerSearchOptions, headers?: object, bypassLoadingList?: boolean): Promise<Resource | null>`

Fetch data from a remote source or local cache. This is the primary method for retrieving resources.

**Parameters:**
- `id`: URI of the resource to fetch
- `context` (optional): JSON-LD context for expanding predicates and IDs
- `parentId` (optional): URI of the parent resource for relative URL resolution
- `localData` (optional): Local data to store instead of fetching
- `forceFetch` (optional): Force fetching even if cached
- `serverPagination` (optional): Server pagination options
- `serverSearch` (optional): Server search options  
- `headers` (optional): Custom HTTP headers
- `bypassLoadingList` (optional): Bypass the loading queue

**Returns:** Promise resolving to the resource or null

```javascript
// Basic usage
const user = await store.getData('/users/123');

// With context
const user = await store.getData('/users/123', {
  '@vocab': 'https://schema.org/',
  foaf: 'http://xmlns.com/foaf/0.1/'
});

// With server pagination
const users = await store.getData('/users', null, null, null, false, {
  pageSize: 10,
  pageNumber: 1
});

// Force refetch
const freshUser = await store.getData('/users/123', null, null, null, true);
```

#### `get(id: string, serverPagination?: ServerPaginationOptions, serverSearch?: ServerSearchOptions): Promise<Resource | null>`

Retrieve a resource from cache only. Does not fetch from remote sources.

**Parameters:**
- `id`: URI of the resource
- `serverPagination` (optional): Server pagination options
- `serverSearch` (optional): Server search options

**Returns:** Promise resolving to the cached resource or null

```javascript
// Get from cache
const cachedUser = await store.get('/users/123');

// Get with pagination parameters
const paginatedResults = await store.get('/users', {
  pageSize: 20,
  pageNumber: 2
});
```

### Data Manipulation

#### `setLocalData(resource: object, id: string, skipFetch?: boolean, bypassLoadingList?: boolean): Promise<string | null>`

Store data locally without sending to a remote server. Useful for creating local-only resources or testing.

**Parameters:**
- `resource`: The resource data to store
- `id`: URI where to store the resource
- `skipFetch` (optional): Skip refetching after storage
- `bypassLoadingList` (optional): Bypass the loading queue

**Returns:** Promise resolving to the resource ID or null

```javascript
// Store local data
const localUser = {
  '@context': { '@vocab': 'https://schema.org/' },
  '@id': '/local-users/1',
  '@type': 'Person',
  name: 'John Doe',
  email: 'john@example.com'
};

await store.setLocalData(localUser, '/local-users/1');
```

#### `post(resource: object, id: string, skipFetch?: boolean): Promise<string | null>`

Send a POST request to create a new resource in a container.

**Parameters:**
- `resource`: The resource data to create
- `id`: URI of the container where to create the resource
- `skipFetch` (optional): Skip refetching after creation

**Returns:** Promise resolving to the new resource ID or null

```javascript
const newUser = {
  '@type': 'Person',
  name: 'Jane Doe',
  email: 'jane@example.com'
};

const userId = await store.post(newUser, '/users/');
```

#### `put(resource: object, id: string, skipFetch?: boolean): Promise<string | null>`

Send a PUT request to completely replace a resource.

**Parameters:**
- `resource`: The complete resource data
- `id`: URI of the resource to replace
- `skipFetch` (optional): Skip refetching after update

**Returns:** Promise resolving to the resource ID or null

```javascript
const updatedUser = {
  '@id': '/users/123',
  '@type': 'Person',
  name: 'John Smith',
  email: 'john.smith@example.com'
};

await store.put(updatedUser, '/users/123');
```

#### `patch(resource: object, id: string, skipFetch?: boolean): Promise<string | null>`

Send a PATCH request to partially update a resource.

**Parameters:**
- `resource`: The partial resource data with changes
- `id`: URI of the resource to update
- `skipFetch` (optional): Skip refetching after update

**Returns:** Promise resolving to the resource ID or null

```javascript
const updates = {
  name: 'John Updated',
  lastModified: new Date().toISOString()
};

await store.patch(updates, '/users/123');
```

#### `delete(id: string, context?: JsonLdContextNormalized | null): Promise<any>`

Send a DELETE request to remove a resource.

**Parameters:**
- `id`: URI of the resource to delete
- `context` (optional): JSON-LD context for ID expansion

**Returns:** Promise resolving to the server response

```javascript
// Delete a user
await store.delete('/users/123');

// Delete with context for ID expansion
await store.delete('user:123', {
  user: 'https://example.org/users/'
});
```

### Cache Management

#### `clearCache(id: string): Promise<void>`

Remove a resource from the cache, including any related federated resources.

**Parameters:**
- `id`: URI of the resource to remove from cache

```javascript
// Clear specific resource from cache
await store.clearCache('/users/123');
```

#### `cacheResource(key: string, resourceProxy: any): Promise<void>`

Manually add a resource to the cache.

**Parameters:**
- `key`: Cache key (usually the resource URI)
- `resourceProxy`: The resource proxy object to cache

```javascript
// Manually cache a resource
await store.cacheResource('/users/123', userProxy);
```

### Language Support

#### `selectLanguage(selectedLanguageCode: string): void`

Set the preferred language for multilingual content.

**Parameters:**
- `selectedLanguageCode`: ISO language code (e.g., 'en', 'fr', 'es')

```javascript
// Set language to French
store.selectLanguage('fr');
```

#### `_getLanguage(): string`

Get the current language setting.

**Returns:** Current language code

```javascript
const currentLang = store._getLanguage();
// Returns 'en', 'fr', etc.
```

### Advanced Querying

#### `queryIndex(options: IndexQueryOptions): Promise<any[]>`

Query an index using SHACL shapes and return matching resources. This enables powerful semantic search capabilities.

**Parameters:**
- `options`: Query configuration object

**IndexQueryOptions Interface:**
```typescript
interface IndexQueryOptions {
  dataSrcProfile?: string;        // Profile data source URI
  dataSrcIndex?: string;          // Index data source URI  
  dataRdfType: string;            // RDF type to query for
  filterValues: Record<string, any>; // Filter criteria
  exactMatchMapping?: Record<string, boolean>; // Exact match flags per field
}
```

**Returns:** Promise resolving to array of matching resources

```javascript
// Search for 3D objects by country
const results = await store.queryIndex({
  dataSrcIndex: '/data/ai/3DObjects-country-index.jsonld',
  dataRdfType: 'tems:3DObject',
  filterValues: {
    'dcat:spatialCoverage': 'Bulgaria'
  },
  exactMatchMapping: {
    'dcat:spatialCoverage': true
  }
});

// Search with multiple criteria
const complexResults = await store.queryIndex({
  dataSrcIndex: '/data/ai/3DObjects-index.jsonld', 
  dataRdfType: 'tems:3DObject',
  filterValues: {
    title: 'Castle',
    'dcat:format': 'FBX',
    'dcat:spatialCoverage': 'Czech Republic'
  },
  exactMatchMapping: {
    'dcat:format': true,
    'dcat:spatialCoverage': true
  }
});
```

#### `queryIndexConjunction(options: ConjunctionQueryOptions): Promise<any[]>`

Query multiple fields and find the intersection (conjunction) of results. Returns resources that match ALL specified criteria.

**Parameters:**
- `options`: Conjunction query configuration object

**ConjunctionQueryOptions Interface:**
```typescript
interface ConjunctionQueryOptions {
  dataSrcProfile?: string;        // Profile data source URI
  dataSrcIndex: string;           // Index data source URI (required)
  dataRdfType: string;            // RDF type to query for
  filterValues: Record<string, any>; // Multiple filter criteria
  useConjunction?: boolean;       // Enable conjunction mode
  exactMatchMapping?: Record<string, boolean>; // Exact match flags per field
}
```

**Returns:** Promise resolving to array of resources matching ALL criteria

```javascript
// Find 3D objects that match multiple criteria simultaneously
const conjunctionResults = await store.queryIndexConjunction({
  dataSrcIndex: '/data/ai/3DObjects-index.jsonld',
  dataRdfType: 'tems:3DObject', 
  filterValues: {
    'dcat:format': 'STL',
    'dcat:spatialCoverage': 'Poland',
    'tems:timePeriod': 'Middle Ages'
  },
  useConjunction: true,
  exactMatchMapping: {
    'dcat:format': true,
    'dcat:spatialCoverage': true, 
    'tems:timePeriod': true
  }
});

// This returns only objects that are:
// - STL format AND
// - From Poland AND  
// - From Middle Ages time period
```

### Authentication & HTTP

#### `fetchAuthn(iri: string, options: any): Promise<Response>`

Make an authenticated HTTP request. Handles authentication automatically if configured.

**Parameters:**
- `iri`: The URI to fetch
- `options`: Fetch options object

**Returns:** Promise resolving to the Response object

```javascript
// Make authenticated request
const response = await store.fetchAuthn('/protected-resource', {
  method: 'GET',
  headers: { 'Accept': 'application/ld+json' }
});

if (response.ok) {
  const data = await response.json();
  // Handle the data
}
```

### Resource Relationships

#### `subscribeResourceTo(resourceId: string, nestedResourceId: string): void`

Set up a subscription so that when `nestedResourceId` changes, `resourceId` gets notified and potentially refreshed.

**Parameters:**
- `resourceId`: ID of the resource that should be updated
- `nestedResourceId`: ID of the resource to watch for changes

```javascript
// When user profile changes, refresh the user list
store.subscribeResourceTo('/users/', '/users/123');
```

### Context & Expansion

#### `getExpandedPredicate(property: string, context: JsonLdContextNormalized | null): string | null`

Expand a property name using JSON-LD context.

**Parameters:**
- `property`: Property name to expand (e.g., 'foaf:name')
- `context`: JSON-LD context for expansion

**Returns:** Expanded IRI or null

```javascript
const context = await store.contextParser.parse([{
  foaf: 'http://xmlns.com/foaf/0.1/'
}]);

const expanded = store.getExpandedPredicate('foaf:name', context);
// Returns: 'http://xmlns.com/foaf/0.1/name'
```

## Configuration

### StoreConfig

Main configuration object for initializing stores.

```typescript
interface StoreConfig {
  type: StoreType;                    // Store type (LDP, FederatedCatalogue)
  endpoint?: string;                  // API endpoint URL
  login?: KeycloakLoginOptions;       // Authentication configuration
  temsServiceBase?: string;           // TEMS service base URL
  temsCategoryBase?: string;          // TEMS category base URL
  temsImageBase?: string;             // TEMS image base URL
  temsProviderBase?: string;          // TEMS provider base URL
  options?: StoreOptions;             // General store options
}
```

### StoreOptions

General store configuration options.

```typescript
interface StoreOptions {
  fetchMethod?: Promise<any>;         // Custom fetch method
  session?: Promise<any>;             // Authentication session
  cacheManager?: CacheManagerInterface; // Custom cache manager
}
```

### ServerPaginationOptions

Configuration for server-side pagination.

```typescript
interface ServerPaginationOptions {
  pageSize?: number;                  // Number of items per page
  pageNumber?: number;                // Page number (1-based)
  // Additional server-specific pagination options
}
```

### ServerSearchOptions

Configuration for server-side search.

```typescript
interface ServerSearchOptions {
  query?: string;                     // Search query string
  fields?: string[];                  // Fields to search in
  // Additional server-specific search options
}
```

## Interfaces and Types

### Resource

The main resource interface representing a Linked Data resource.

```typescript
interface Resource {
  '@id': string;                      // Resource identifier
  '@type'?: string | string[];        // Resource type(s)
  '@context'?: object;                // JSON-LD context
  
  // Methods
  isContainer?(): boolean;            // Check if resource is a container
  isFullResource?(): boolean;         // Check if resource is fully loaded
  getResourceData(): object;          // Get raw resource data
  clientContext: object;              // Client-side context
  serverContext: object;              // Server-side context
  
  // Dynamic properties based on JSON-LD context
  [key: string]: any;
}
```

### StoreType

Enumeration of available store types.

```typescript
enum StoreType {
  LDP = 'ldp',                        // Linked Data Platform store
  FederatedCatalogue = 'federatedCatalogue' // Federated catalogue store
}
```

## Examples

### Basic Resource Management

```javascript
import { StoreService } from '@startinblox/core';

const store = StoreService.getInstance();

// Create a new user
const newUser = {
  '@type': 'Person',
  name: 'Alice Smith',
  email: 'alice@example.com',
  skills: ['JavaScript', 'Python', 'RDF']
};

const userId = await store.post(newUser, '/users/');
console.log('Created user:', userId);

// Retrieve the user
const user = await store.getData(userId);
console.log('User name:', await user.name);
console.log('User skills:', await user.skills);

// Update the user
await store.patch({ name: 'Alice Johnson' }, userId);

// Delete the user
await store.delete(userId);
```

### Working with Context

```javascript
const context = {
  '@vocab': 'https://schema.org/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  dfc: 'http://static.datafoodconsortium.org/',
  'dfc:hasType': { '@type': '@id' }
};

const enterprise = {
  '@context': context,
  '@id': '/enterprises/1',
  '@type': 'dfc:Enterprise',
  name: 'Green Farm Co.',
  'dfc:hasType': {
    '@id': 'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Producer'
  }
};

await store.setLocalData(enterprise, '/enterprises/1');

const retrievedEnterprise = await store.get('/enterprises/1');
const businessType = await retrievedEnterprise['dfc:hasType'];
console.log('Business type:', businessType); // Returns the string URL directly
```

### Advanced Querying

```javascript
// Single field search
const castleResults = await store.queryIndex({
  dataSrcIndex: '/data/ai/3DObjects-title-index.jsonld',
  dataRdfType: 'tems:3DObject',
  filterValues: {
    title: 'castle'
  }
});

// Multi-criteria conjunction search  
const specificResults = await store.queryIndexConjunction({
  dataSrcIndex: '/data/ai/3DObjects-index.jsonld',
  dataRdfType: 'tems:3DObject',
  filterValues: {
    'dcat:format': 'FBX',
    'dcat:spatialCoverage': 'Czech Republic',
    'tems:timePeriod': 'Middle Ages'
  },
  useConjunction: true,
  exactMatchMapping: {
    'dcat:format': true,
    'dcat:spatialCoverage': true,
    'tems:timePeriod': true
  }
});
```

### Pagination and Search

```javascript
// Server-side pagination
const paginatedUsers = await store.getData('/users', null, null, null, false, {
  pageSize: 20,
  pageNumber: 1
});

// Server-side search
const searchResults = await store.getData('/users', null, null, null, false, null, {
  query: 'john',
  fields: ['name', 'email']
});

// Combined pagination and search
const pagedSearchResults = await store.getData('/users', null, null, null, false, 
  { pageSize: 10, pageNumber: 2 },
  { query: 'developer', fields: ['occupation', 'skills'] }
);
```

### Cache Management

```javascript
// Preload and cache resources
await store.getData('/users/important-user');

// Check if in cache (via get - won't fetch if not cached)
const cachedUser = await store.get('/users/important-user');

if (cachedUser) {
  console.log('User is cached');
} else {
  console.log('User not in cache');
}

// Force refresh from server
const freshUser = await store.getData('/users/important-user', null, null, null, true);

// Clear from cache
await store.clearCache('/users/important-user');
```

### Error Handling

```javascript
try {
  const user = await store.getData('/users/nonexistent');
  if (!user) {
    console.log('User not found');
  }
} catch (error) {
  console.error('Error fetching user:', error);
}

try {
  await store.post(invalidUserData, '/users/');
} catch (error) {
  console.error('Error creating user:', error.message);
  // Handle validation errors, network errors, etc.
}
```

## Type Guards

The store provides type guard functions to check for optional functionality:

```javascript
import { hasQueryIndex, hasSetLocalData, hasQueryIndexConjunction } from '@startinblox/core';

const store = StoreService.getInstance();

if (hasQueryIndex(store)) {
  // Store supports queryIndex
  const results = await store.queryIndex(options);
}

if (hasSetLocalData(store)) {
  // Store supports local data storage
  await store.setLocalData(data, id);
}

if (hasQueryIndexConjunction(store)) {
  // Store supports conjunction queries
  const results = await store.queryIndexConjunction(options);
}
```

This comprehensive documentation covers all public methods and interfaces of the StartinBlox Store. For more specific use cases or advanced configurations, refer to the individual component documentation and examples in the repository.