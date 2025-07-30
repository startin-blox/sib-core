import type { Source } from './interfaces.ts';

export interface SelfDescription extends Source {
  proof: Proof2;
}

export interface VerifiableCredential {
  '@context': string[];
  '@type': string[];
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: CredentialSubject;
  proof: Proof;
}

export interface CredentialSubject {
  '@context': Context;
  '@id': string;
  '@type': string;
  'gax-core:offeredBy': GaxCoreOfferedBy;
  'gax-core:operatedBy': GaxCoreOperatedBy;
  'gax-trust-framework:termsAndConditions': GaxTrustFrameworkTermsAndConditions;
  'gax-trust-framework:policy': string;
  'gax-trust-framework:dataAccountExport': GaxTrustFrameworkDataAccountExport;
  'dcat:dataset': DcatDataset;
  'dcat:distribution': any[];
  'dcat:service': DcatService;
  'dspace:participantId': string;
}

export interface Context {
  dcat: string;
  dct: string;
  odrl: string;
  dspace: string;
  '@vocab': string;
  edc: string;
  'gax-core': string;
  'gax-trust-framework': string;
  xsd: string;
}

export interface GaxCoreOfferedBy {
  '@id': string;
}

export interface GaxCoreOperatedBy {
  '@id': string;
}

export interface GaxTrustFrameworkTermsAndConditions {
  '@type': string;
  'gax-trust-framework:content': GaxTrustFrameworkContent;
  'gax-trust-framework:hash': string;
}

export interface GaxTrustFrameworkContent {
  '@type': string;
  '@value': string;
}

export interface GaxTrustFrameworkDataAccountExport {
  '@type': string;
  'gax-trust-framework:accessType': string;
  'gax-trust-framework:formatType': string;
  'gax-trust-framework:requestType': string;
}

export interface DcatDataset {
  '@id': string;
  '@type': string;
  'odrl:hasPolicy': OdrlHasPolicy;
  'dcat:distribution': DcatDistribution[];
  'dcat:dataset'?: DcatDataset2;
  'dcat:service'?: DcatDataset2;
}

export interface OdrlHasPolicy {
  '@id': string;
  '@type': string;
  'odrl:permission': OdrlPermission;
  'odrl:prohibition': any[];
  'odrl:obligation': any[];
}

export interface OdrlPermission {
  'odrl:action': OdrlAction;
}

export interface OdrlAction {
  '@id': string;
}

export interface DcatDistribution {
  '@type': string;
  'dct:format': DctFormat;
  'dcat:accessService': DcatAccessService;
}

export interface DctFormat {
  '@id': string;
}

export interface DcatAccessService {
  '@id': string;
  '@type': string;
  'dcat:endpointDescription': string;
  'dcat:endpointUrl': string;
  'dcat:endpointURL': string;
}

export interface DcatDataset2 {
  '@type': string[];
  '@id': string;
  'dct:title': string;
  'rdfs:comment': string;
  'dcat:keyword': string[];
  'dcat:version': string;
  'dct:creator'?: DctCreator;
  'dct:temporal': string;
  'foaf:thumbnail'?: HttpXmlnsComFoaf01Thumbnail;
}

export interface DctCreator {
  '@type': string[];
  'foaf:name': string;
  'foaf:thumbnail': HttpXmlnsComFoaf01Thumbnail;
}

export interface HttpXmlnsComFoaf01Thumbnail {
  'rdf:resource': string;
}

export interface DcatService {
  '@id': string;
  '@type': string;
  'dcat:endpointDescription': string;
  'dcat:endpointUrl': string;
  'dcat:endpointURL': string;
}

export interface Proof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  jws: string;
}

export interface Proof2 {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  jws: string;
}
