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
  - [Authentication & HTTP](#authentication--http)
    - [Authentication with AuthFetchResolver](#authentication-with-authfetchresolver)
  - [Resource Relationships](#resource-relationships)
  - [Context & Expansion](#context--expansion)
- [Configuration](#configuration)
- [Interfaces and Types](#interfaces-and-types)
- [Examples](#examples)

## Getting Started

### Lightweight Store Import

If you only need the store layer (without components, mixins, and widgets), import from `store` directly. This is significantly smaller than the full framework (~1.5 MB vs ~4.4 MB):

```javascript
// ES module import (bundler or npm)
import { StoreService, StoreType, sibStore } from '@startinblox/core/store';

// CDN import
import { StoreService, StoreType, sibStore } from 'https://cdn.jsdelivr.net/npm/@startinblox/core@0.19/dist/store.js';
```

Or in a plain HTML page:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@startinblox/core@0.19/dist/store.js"></script>
<script type="module">
  // Available on the window.sib namespace after import
  const store = window.sib.store;
  const data = await store.getData('/api/resources');
</script>
```

### `window.sib` Namespace

When `store.js` is loaded, the following are exposed globally on `window.sib`:

| Property | Description |
|----------|-------------|
| `window.sib.store` | Default store instance (same as `sibStore` ES export) |
| `window.sib.storeService` | `StoreService` class for managing multiple stores |
| `window.sib.storeType` | `StoreType` enum (`LDP`, `FederatedCatalogue`, `DataspaceConnector`) |
| `window.sib.hasQueryIndex(store)` | Type guard: checks if store supports `queryIndex` |
| `window.sib.hasSetLocalData(store)` | Type guard: checks if store supports `setLocalData` |
| `window.sib.hasQueryIndexConjunction(store)` | Type guard: checks if store supports `queryIndexConjunction` |

`window.sibStore` is also kept for backward compatibility and references the same instance as `window.sib.store`.

### Full Framework Import

If you need the complete framework (components, mixins, widgets, and store):

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

### TypeScript Support

The store entry point also exports all relevant types for TypeScript consumers:

```typescript
import type {
  IStore,
  Resource,
  LimitedResource,
  Container,
  StoreConfig,
  StoreInstance,
  GetDataArgs,
  ConjunctionQueryOptions,
} from '@startinblox/core/store';
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

The store provides flexible authentication mechanisms through the `AuthFetchResolver` utility class and authenticated HTTP methods.

#### Authentication with AuthFetchResolver

The `AuthFetchResolver` is a universal authentication resolver that automatically discovers and integrates with any authentication component in your application's DOM. It provides a zero-dependency approach to authentication that works with any auth implementation following simple conventions.

##### How It Works

`AuthFetchResolver` searches for authentication elements in the DOM that expose a `getFetch()` method. By default, it looks for:
- `sib-auth-oidc` - OpenID Connect authentication component
- `sib-auth` - Standard authentication component

The resolver automatically:
1. Discovers auth elements in the DOM
2. Retrieves the authenticated fetch function via the `getFetch()` method
3. Falls back to standard `fetch` if no auth element is found
4. Listens for dynamic auth activation via `sib-auth:activated` events

##### Static Methods

**`findAuthElement(selectors?: string[]): Element | null`**

Finds any authentication element in the DOM that has a `getFetch()` method.

**Parameters:**
- `selectors` (optional): Array of CSS selectors to check, defaults to `['sib-auth-oidc', 'sib-auth']`

**Returns:** The auth element or null if not found

```javascript
import { AuthFetchResolver } from '@startinblox/core';

// Find with default selectors
const authElement = AuthFetchResolver.findAuthElement();

// Find with custom selectors
const customAuth = AuthFetchResolver.findAuthElement(['my-auth', 'custom-auth']);
```

**`getAuthFetch(selectors?: string[]): (input: RequestInfo, init?: RequestInit) => Promise<Response>`**

Gets an authenticated fetch function from any compatible auth component.

**Parameters:**
- `selectors` (optional): Custom selectors to check

**Returns:** Authenticated fetch function or regular fetch as fallback

```javascript
// Get authenticated fetch (used automatically by LdpStore)
const authFetch = AuthFetchResolver.getAuthFetch();

// Use it for requests
const response = await authFetch('/api/protected-resource', {
  method: 'GET',
  headers: { 'Accept': 'application/ld+json' }
});
```

**`onAuthActivated(callback: Function, eventName?: string): () => void`**

Sets up an event listener for dynamic authentication activation. Useful when auth components initialize after store creation.

**Parameters:**
- `callback`: Function to call when auth is activated, receives the fetch function
- `eventName` (optional): Custom event name, defaults to `'sib-auth:activated'`

**Returns:** Cleanup function to remove the event listener

```javascript
// Listen for auth activation
const cleanup = AuthFetchResolver.onAuthActivated((fetchFn) => {
  console.log('Authentication activated!');
  // Update your store or components with the new fetch function
  myStore.fetch = fetchFn;
});

// Later, cleanup when no longer needed
cleanup();
```

**`waitForAuthElement(selectors?: string[], timeout?: number): Promise<Element>`**

Waits for an authentication element to appear in the DOM. Returns immediately if the element already exists.

**Parameters:**
- `selectors` (optional): Selectors to watch for, defaults to `['sib-auth-oidc', 'sib-auth']`
- `timeout` (optional): Maximum wait time in milliseconds, defaults to 5000ms

**Returns:** Promise that resolves with the auth element or rejects on timeout

```javascript
try {
  // Wait for auth element to appear
  const authElement = await AuthFetchResolver.waitForAuthElement();
  console.log('Auth element ready!');

  // Now you can safely get the auth fetch
  const authFetch = AuthFetchResolver.getAuthFetch();
} catch (error) {
  console.error('Auth element not found:', error);
}

// With custom timeout
const authElement = await AuthFetchResolver.waitForAuthElement(
  ['sib-auth-oidc'],
  10000 // 10 seconds
);
```

##### Integration with LdpStore

The `LdpStore` automatically uses `AuthFetchResolver` when no custom `fetchMethod` is provided in the store options:

```javascript
import { StoreService, StoreType } from '@startinblox/core';

// Store will automatically use AuthFetchResolver
StoreService.init({
  type: StoreType.LDP,
  options: {
    // No fetchMethod specified - AuthFetchResolver is used automatically
  }
});

// Or provide a custom fetch method
StoreService.init({
  type: StoreType.LDP,
  options: {
    fetchMethod: customAuthenticatedFetch
  }
});
```

When using the automatic resolution, the store:
1. Calls `AuthFetchResolver.getAuthFetch()` on initialization
2. Listens for `sib-auth:activated` events to update the fetch method when auth components initialize later

##### HTML Integration Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="@startinblox/core"></script>
</head>
<body>
  <!-- Authentication component -->
  <sib-auth-oidc auto-login>
    <sib-auth-provider-oidc
      data-authority="https://auth.example.com/realms/app/"
      data-client-id="my-app"
      data-scope="openid profile"
    ></sib-auth-provider-oidc>
  </sib-auth-oidc>

  <!-- Store automatically uses auth from sib-auth-oidc -->
  <solid-display
    data-src="https://api.example.com/protected-resource/"
  ></solid-display>
</body>
</html>
```

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

### AuthFetchResolver

A utility class for resolving authenticated fetch functions from authentication components in the DOM.

```typescript
class AuthFetchResolver {
  /**
   * Finds any auth element in DOM that has a getFetch method
   * @param selectors - Array of CSS selectors to check (defaults to ['sib-auth-oidc', 'sib-auth'])
   * @returns Auth element or null
   */
  static findAuthElement(selectors?: string[]): Element | null;

  /**
   * Gets authenticated fetch function from any compatible auth component
   * @param selectors - Optional custom selectors to check
   * @returns Authenticated fetch function or regular fetch as fallback
   */
  static getAuthFetch(
    selectors?: string[]
  ): (input: RequestInfo, init?: RequestInit) => Promise<Response>;

  /**
   * Sets up event listener for dynamic auth activation
   * @param callback - Function to call when auth is activated (receives fetch function)
   * @param eventName - Custom event name (defaults to 'sib-auth:activated')
   * @returns Cleanup function to remove the event listener
   */
  static onAuthActivated(
    callback: (fetchFn: (input: RequestInfo, init?: RequestInit) => Promise<Response>) => void,
    eventName?: string
  ): () => void;

  /**
   * Waits for any auth element to appear in DOM
   * @param selectors - Selectors to watch for (defaults to ['sib-auth-oidc', 'sib-auth'])
   * @param timeout - Maximum wait time in milliseconds (defaults to 5000ms)
   * @returns Promise that resolves with auth element or rejects on timeout
   */
  static async waitForAuthElement(
    selectors?: string[],
    timeout?: number
  ): Promise<Element>;
}
```

**Auth Component Requirements:**

For a component to work with `AuthFetchResolver`, it must:
1. Be discoverable via CSS selector (e.g., `sib-auth-oidc`, `sib-auth`, or custom selector)
2. Implement a `getFetch()` method that returns an authenticated fetch function
3. Optionally dispatch `sib-auth:activated` events with `{ fetch }` detail when authentication is ready

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
  LDP = 'ldp',                                    // Linked Data Platform store
  FederatedCatalogue = 'federatedCatalogue',       // Federated catalogue store
  DataspaceConnector = 'dataspaceConnector',       // Eclipse Dataspace Connector store
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

### Authentication Examples

#### Basic Auth Integration

```javascript
import { AuthFetchResolver } from '@startinblox/core';

// Check if auth element exists
const authElement = AuthFetchResolver.findAuthElement();
if (authElement) {
  console.log('Auth component found:', authElement.tagName);
} else {
  console.log('No auth component available');
}

// Get authenticated fetch
const authFetch = AuthFetchResolver.getAuthFetch();

// Use it for API calls
const response = await authFetch('https://api.example.com/protected', {
  method: 'GET',
  headers: { 'Accept': 'application/ld+json' }
});
```

#### Dynamic Auth Activation

```javascript
import { StoreService, AuthFetchResolver } from '@startinblox/core';

const store = StoreService.getInstance();

// Listen for auth activation and update store
const cleanup = AuthFetchResolver.onAuthActivated((authFetch) => {
  console.log('Auth activated! Updating store...');
  store.fetch = authFetch;

  // Optionally refetch protected resources
  store.clearCache('/protected-resource');
  store.getData('/protected-resource', null, null, null, true);
});

// Cleanup when component unmounts
window.addEventListener('beforeunload', cleanup);
```

#### Waiting for Auth Component

```javascript
import { AuthFetchResolver } from '@startinblox/core';

async function initializeApp() {
  try {
    // Wait for auth component to be ready
    await AuthFetchResolver.waitForAuthElement(['sib-auth-oidc'], 10000);

    // Auth is ready, initialize your app
    const authFetch = AuthFetchResolver.getAuthFetch();

    // Make authenticated requests
    const userData = await authFetch('/api/user/profile');
    console.log('User data:', await userData.json());

  } catch (error) {
    console.error('Auth initialization failed:', error);
    // Fallback to non-authenticated mode or show error
  }
}

initializeApp();
```

#### Custom Auth Selectors

```javascript
import { AuthFetchResolver, StoreService } from '@startinblox/core';

// If you have a custom auth component
const customAuthFetch = AuthFetchResolver.getAuthFetch(['my-custom-auth', 'sib-auth-oidc']);

// Use it with the store
StoreService.init({
  type: 'ldp',
  options: {
    fetchMethod: customAuthFetch
  }
});
```

## Type Guards

The store provides type guard functions to check for optional functionality. These are available from both the lightweight store import and the full framework:

```javascript
import { hasQueryIndex, hasSetLocalData, hasQueryIndexConjunction } from '@startinblox/core/store';
// or: import { ... } from '@startinblox/core';
// or: window.sib.hasQueryIndex / window.sib.hasSetLocalData / window.sib.hasQueryIndexConjunction

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