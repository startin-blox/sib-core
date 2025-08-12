/**
 * 1. Updated interfaces: when "dcat:dataset" is present, it is an array
 *    with exactly one DcatService object inside.
 */

export interface DcatService {
  '@type': string[];
  '@id': string;
  'dcterms:title': string;
  'rdfs:comment': string;
  'dcat:keyword': string[];
  'dcat:version': string;
  'dcterms:creator': {
    '@type': string[];
    'foaf:name': string;
    'foaf:thumbnail': { 'rdf:resource': string };
  };
  'dcterms:temporal': string;
  'dcat:endpointURL': string;
  'dcat:endpointDescription': string;
  'foaf:thumbnail'?: { 'rdf:resource': string };
}

interface CredentialSubject {
  '@context': Record<string, string>;
  '@id': string;
  '@type': string;

  // Depending on which key is present, we choose the provider mapping accordingly:
  'gax-core:operatedBy'?: { '@id': string };
  'gax-core:offeredBy'?: { '@id': string };

  'gax-trust-framework:termsAndConditions'?: {
    '@type': string;
    'gax-trust-framework:content': { '@type': string; '@value': string };
    'gax-trust-framework:hash': string;
  };
  'gax-trust-framework:policy'?: string;
  'gax-trust-framework:dataAccountExport'?: {
    'gax-trust-framework:accessType': string;
    'gax-trust-framework:formatType': string;
    'gax-trust-framework:requestType': string;
  };

  /**
   * Either “dcat:service” (single object) or “dcat:dataset” (array containing one object)
   * will hold the DcatService fields.
   */
  'dcat:service'?: DcatService;
  'dcat:dataset'?: DcatService[];
}

interface VerifiableCredential {
  '@context': string[];
  '@type': string[];
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: CredentialSubject;
  proof?: { [key: string]: any };
}

export interface Source {
  '@context': string[];
  id: string;
  type: string[];
  verifiableCredential: VerifiableCredential;
  proof?: { [key: string]: any };
}

export interface Container<T> extends Resource {
  'ldp:contains': T[];
}

type Permission = 'add' | 'delete' | 'change' | 'control' | 'view' | string;
type Context = Record<string, string | { '@id': string }>;
type DateTime = string;

export interface LimitedResource {
  '@id': string;
  '@type'?: string | string[] | Promise<string | string[]>;
  _originalResource?: Resource;
  properties?: string[] | Promise<string[]>;
  permissions?: Permission[];
  clientContext?: Context | Promise<Context>;
  serverContext?: Context | Promise<Context>;
  creation_date?: DateTime;
  update_date?: DateTime;
}

export interface Resource extends LimitedResource {
  [key: string]: any;
}

export interface Destination {
  '@id': string;
  creation_date: string;
  update_date: string;
  name: string;
  description: string;
  long_description: string;
  categories: {
    '@id': string;
    '@type': 'ldp:Container';
    'ldp:contains': Array<{ '@id': string; '@type': 'tems:Category' }>;
  };
  activation_status: boolean;
  activation_date: string | null;
  licence: string | null;
  is_in_app: boolean;
  is_external: boolean;
  is_api: boolean;
  images: {
    '@id': string;
    '@type': 'ldp:Container';
    'ldp:contains': Array<{ '@id': string; '@type': 'tems:Image' }>;
  };
  release_date: string | null;
  last_update: string | null;
  developper: string | null;
  contact_url: string;
  documentation_url: string;
  url: string;
  provider: {
    '@id': string;
    '@type': string;
    name: string;
    image: {
      '@id': string;
      '@type': string;
      url: string;
      iframe: boolean;
      name: string;
    };
  };
  data_offers: any[];
  '@type': string;
}
