/**
 * Test fixtures for localStorage cache tests
 *
 * This file provides reusable mock data for testing the caching implementation.
 */

import type { CacheItemMetadata } from '../../src/libs/store/cache/LocalStorageCacheMetadata.ts';

/**
 * Mock cache item metadata samples
 */
export const mockCacheItems: Record<string, CacheItemMetadata> = {
  item1: {
    sdHash: 'hash-abc123',
    uploadDatetime: '2024-01-01T10:00:00Z',
    statusDatetime: '2024-01-01T10:00:00Z',
    cachedAt: 1704103200000, // 2024-01-01 10:00:00 UTC
    resourceId: 'urn:uuid:resource-1',
  },
  item2: {
    sdHash: 'hash-def456',
    uploadDatetime: '2024-01-02T14:30:00Z',
    statusDatetime: '2024-01-02T14:30:00Z',
    cachedAt: 1704206200000, // 2024-01-02 14:30:00 UTC
    resourceId: 'urn:uuid:resource-2',
  },
  item3: {
    sdHash: 'hash-ghi789',
    uploadDatetime: '2024-01-03T08:15:00Z',
    statusDatetime: '2024-01-03T08:15:00Z',
    cachedAt: 1704267300000, // 2024-01-03 08:15:00 UTC
    resourceId: 'urn:uuid:resource-3',
  },
  updatedItem: {
    sdHash: 'hash-abc123', // Same hash as item1
    uploadDatetime: '2024-01-10T12:00:00Z', // Newer timestamp
    statusDatetime: '2024-01-10T12:00:00Z',
    cachedAt: 1704888000000, // 2024-01-10 12:00:00 UTC
    resourceId: 'urn:uuid:resource-1', // Same resource as item1
  },
};

/**
 * Mock self-description (SD) API response
 */
export const mockSelfDescriptions = {
  simple: {
    items: [
      {
        meta: {
          sdHash: 'hash-service-1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
        },
      },
      {
        meta: {
          sdHash: 'hash-service-2',
          uploadDatetime: '2024-01-02T00:00:00Z',
          statusDatetime: '2024-01-02T00:00:00Z',
        },
      },
    ],
  },
  withUpdates: {
    items: [
      {
        meta: {
          sdHash: 'hash-service-1',
          uploadDatetime: '2024-01-01T00:00:00Z',
          statusDatetime: '2024-01-01T00:00:00Z',
        },
      },
      {
        meta: {
          sdHash: 'hash-service-2',
          uploadDatetime: '2024-01-03T00:00:00Z', // Updated
          statusDatetime: '2024-01-03T00:00:00Z',
        },
      },
      {
        meta: {
          sdHash: 'hash-service-3', // New
          uploadDatetime: '2024-01-02T00:00:00Z',
          statusDatetime: '2024-01-02T00:00:00Z',
        },
      },
    ],
  },
  empty: {
    items: [],
  },
};

/**
 * Mock verifiable credential for a service offering
 */
export const mockVerifiableCredential = (
  id: string,
  title: string,
  description = 'Service description',
) => ({
  verifiableCredential: {
    issuanceDate: '2024-01-01T00:00:00Z',
    expirationDate: '2024-12-31T23:59:59Z',
    credentialSubject: {
      '@id': `urn:svc:${id}`,
      '@type': ['gax-trust-framework:ServiceOffering'],
      'dcat:service': {
        'dcterms:title': title,
        'rdfs:comment': description,
        'dcat:keyword': ['test', 'mock'],
        'dcat:endpointURL': `https://example.com/api/${id}`,
        'dcat:endpointDescription': `https://example.com/docs/${id}`,
        'dcterms:creator': {
          'foaf:name': 'Test Provider',
          'foaf:thumbnail': {
            'rdf:resource': 'https://example.com/logo.png',
          },
        },
      },
      'gax-core:operatedBy': {
        '@id': 'did:example:provider-1',
      },
    },
  },
  proof: {
    type: 'Ed25519Signature2020',
    created: '2024-01-01T00:00:00Z',
    proofPurpose: 'assertionMethod',
  },
});

/**
 * Mock verifiable credential with dataset (for data offers)
 */
export const mockVerifiableCredentialWithDataset = (
  id: string,
  title: string,
  policyId = 'policy-1',
) => ({
  verifiableCredential: {
    issuanceDate: '2024-01-01T00:00:00Z',
    expirationDate: '2024-12-31T23:59:59Z',
    credentialSubject: {
      '@id': `urn:uuid:${id}`,
      '@type': ['gax-trust-framework:ServiceOffering'],
      'dcat:endpointURL': 'https://provider.example.com/protocol',
      'dspace:participantId': 'provider-participant-id',
      'dcat:dataset': [
        {
          '@id': `urn:uuid:dataset-${id}`,
          '@type': 'dcat:Dataset',
          'dcterms:title': title,
          'rdfs:comment': 'Dataset description',
          'dcat:keyword': ['data', 'test'],
          'odrl:hasPolicy': {
            '@id': `urn:tems:${policyId}`,
            '@type': 'odrl:Set',
            'odrl:permission': [
              {
                'odrl:action': 'odrl:use',
                'odrl:constraint': [
                  {
                    'odrl:leftOperand': 'urn:tems:purpose',
                    'odrl:operator': 'odrl:eq',
                    'odrl:rightOperand': 'urn:tems:research',
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  },
  proof: {},
});

/**
 * Mock TEMS-mapped service resource
 */
export const mockTemsService = (
  slug: string,
  name: string,
  serviceBase = 'https://tems.example.com/services/',
) => ({
  '@id': `${serviceBase}${encodeURIComponent(slug)}/`,
  '@type': 'tems:Service',
  name,
  description: `Description for ${name}`,
  long_description: 'Keywords: test, mock',
  creation_date: '2024-01-01T00:00:00Z',
  update_date: '2024-12-31T23:59:59Z',
  activation_status: true,
  activation_date: null,
  licence: null,
  is_in_app: true,
  is_external: true,
  is_api: true,
  release_date: null,
  last_update: null,
  developper: null,
  contact_url: `https://example.com/docs/${slug}`,
  documentation_url: `https://example.com/docs/${slug}`,
  url: `https://example.com/api/${slug}`,
  categories: {
    '@id': `${serviceBase}${encodeURIComponent(slug)}/categories/`,
    '@type': 'ldp:Container',
    'ldp:contains': [
      {
        '@id': 'https://tems.example.com/categories/test/',
        '@type': 'tems:Category',
        name: 'test',
      },
      {
        '@id': 'https://tems.example.com/categories/mock/',
        '@type': 'tems:Category',
        name: 'mock',
      },
    ],
  },
  images: {
    '@id': `${serviceBase}${encodeURIComponent(slug)}/images/`,
    '@type': 'ldp:Container',
    'ldp:contains': [
      {
        '@id': 'https://tems.example.com/images/logo.png/',
        '@type': 'tems:Image',
        url: 'https://example.com/logo.png',
        iframe: false,
        name: 'logo.png',
      },
    ],
  },
  provider: {
    '@id': 'https://tems.example.com/providers/provider-1/',
    '@type': 'tems:Provider',
    name: 'Test Provider',
    image: {
      '@id': 'https://tems.example.com/images/logo.png/',
      '@type': 'tems:Image',
      url: 'https://example.com/logo.png',
      iframe: false,
      name: 'logo.png',
    },
  },
  data_offers: [],
});

/**
 * Mock LDP Container for federated catalogue
 */
export const mockFederatedCatalogContainer = (
  endpoint: string,
  items: any[] = [],
) => {
  const endpointHash = endpoint.replace(/[^a-zA-Z0-9]/g, '');
  return {
    '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
    '@type': 'ldp:Container',
    '@id': `store://local.fc-${endpointHash}-default/`,
    'ldp:contains': items,
    permissions: ['view'],
  };
};

/**
 * Helper to create OAuth token response
 */
export const mockAuthTokenResponse = (
  accessToken = 'mock-access-token',
  expiresIn = 3600,
) => ({
  statusCode: 200,
  body: {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn,
    refresh_token: 'mock-refresh-token',
    scope: 'openid profile email',
  },
  headers: {
    'content-type': 'application/json',
  },
});

/**
 * Helper to create error responses
 */
export const mockErrorResponses = {
  unauthorized: {
    statusCode: 401,
    body: {
      error: 'unauthorized',
      error_description: 'Invalid credentials',
    },
  },
  serverError: {
    statusCode: 500,
    body: {
      error: 'internal_server_error',
      error_description: 'Something went wrong',
    },
  },
  notFound: {
    statusCode: 404,
    body: {
      error: 'not_found',
      error_description: 'Resource not found',
    },
  },
  quotaExceeded: {
    name: 'QuotaExceededError',
    message: 'localStorage quota exceeded',
  },
};

/**
 * Helper to create store configuration
 */
export const createMockStoreConfig = (overrides = {}) => ({
  type: 'FederatedCatalogue',
  endpoint: 'https://api.example.com',
  login: {
    kc_username: 'test-user',
    kc_password: 'test-password',
    kc_url:
      'https://auth.startinblox.com/realms/tems/protocol/openid-connect/token',
    kc_grant_type: 'password',
    kc_client_id: 'test-client',
    kc_client_secret: 'test-secret',
    kc_scope: 'openid',
  },
  temsServiceBase: 'https://tems.example.com/services/',
  temsCategoryBase: 'https://tems.example.com/categories/',
  temsImageBase: 'https://tems.example.com/images/',
  temsProviderBase: 'https://tems.example.com/providers/',
  enableLocalStorageMetadata: true,
  cacheTTL: 2 * 60 * 60 * 1000, // 2 hours
  ...overrides,
});

/**
 * Time constants for testing
 */
export const TIME_CONSTANTS = {
  ONE_HOUR: 60 * 60 * 1000,
  TWO_HOURS: 2 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Helper to generate a batch of mock cache items
 */
export const generateMockCacheItems = (count: number): CacheItemMetadata[] => {
  const items: CacheItemMetadata[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    items.push({
      sdHash: `hash-${i.toString().padStart(3, '0')}`,
      uploadDatetime: new Date(baseTime + i * 60000).toISOString(),
      statusDatetime: new Date(baseTime + i * 60000).toISOString(),
      cachedAt: baseTime + i * 60000,
      resourceId: `urn:uuid:test-resource-${i}`,
    });
  }

  return items;
};

/**
 * Helper to generate mock self-descriptions API list
 */
export const generateMockSelfDescriptionsList = (hashes: string[]) => ({
  items: hashes.map((hash, index) => ({
    meta: {
      sdHash: hash,
      uploadDatetime: new Date(Date.now() + index * 60000).toISOString(),
      statusDatetime: new Date(Date.now() + index * 60000).toISOString(),
    },
  })),
});
