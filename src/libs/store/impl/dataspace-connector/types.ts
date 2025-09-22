import type { StoreConfig } from '../../shared/types';

// Dataspace Protocol Configuration
export interface DataspaceConnectorConfig extends StoreConfig {
  // Required endpoints (v3 API)
  catalogEndpoint: string; // /v3/catalog/request
  contractNegotiationEndpoint: string; // /v3/contractnegotiations
  transferProcessEndpoint: string; // /v3/transferprocesses

  // Additional v3 endpoints
  assetsEndpoint?: string; // /v3/assets
  policiesEndpoint?: string; // /v3/policydefinitions
  contractDefinitionsEndpoint?: string; // /v3/contractdefinitions

  // API version
  apiVersion?: 'v2' | 'v3'; // Default to v3

  // Authentication - Eclipse EDC specific
  authMethod: 'edc-api-key' | 'bearer' | 'oauth2' | 'delegated';

  // EDC API Key authentication (most common)
  edcApiKey?: string;

  // Standard authentication methods
  bearerToken?: string;
  oauth2Config?: OAuth2Config;

  // EDC Delegated Authentication Service
  delegatedAuthConfig?: DelegatedAuthConfig;

  // Optional configuration
  participantId?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface OAuth2Config {
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}

// EDC Delegated Authentication Configuration
export interface DelegatedAuthConfig {
  keyUrl: string; // edc.api.auth.dac.key.url
  identityProviderEndpoint: string;
  tokenValidationEndpoint?: string;
  clientId?: string;
  clientSecret?: string;
}

// Dataspace Protocol Messages
export interface ContractNegotiationRequest {
  '@context': string[];
  '@type': 'https://w3id.org/edc/v0.0.1/ns/ContractRequestMessage';
  counterPartyAddress: string;
  protocol: 'dataspace-protocol-http';
  policy: OdrlPolicy;
  callbackAddresses?: string[];
}

export interface ContractNegotiationResponse {
  '@context': string[];
  '@type': 'https://w3id.org/edc/v0.0.1/ns/ContractNegotiation';
  '@id': string;
  state: ContractNegotiationState;
  counterPartyId: string;
  contractAgreementId?: string;
  errorDetail?: string;
  createdAt: number;
}

export interface TransferRequest {
  '@context': string[];
  '@type': 'https://w3id.org/edc/v0.0.1/ns/TransferRequestMessage';
  counterPartyAddress: string;
  contractId: string;
  dataDestination: DataAddress;
  managedResources?: boolean;
  callbackAddresses?: string[];
}

export interface TransferProcess {
  '@context': string[];
  '@type': 'https://w3id.org/edc/v0.0.1/ns/TransferProcess';
  '@id': string;
  state: TransferProcessState;
  contractId: string;
  dataAddress?: DataAddress;
  errorDetail?: string;
  createdAt: number;
}

export interface CatalogRequest {
  '@context': string[];
  '@type': 'https://w3id.org/edc/v0.0.1/ns/CatalogRequestMessage';
  counterPartyAddress: string;
  protocol: 'dataspace-protocol-http';
  querySpec?: QuerySpec;
}

export interface CatalogResponse {
  '@context': string[];
  '@type': 'https://w3id.org/edc/v0.0.1/ns/Catalog';
  '@id': string;
  participantId: string;
  'dcat:dataset': Dataset[];
  'dcat:service'?: DataService[];
}

// Supporting Types
export interface OdrlPolicy {
  '@type': 'Set' | 'Offer' | 'Agreement';
  '@id'?: string;
  target?: string;
  assigner?: string;
  assignee?: string;
  permission?: Permission[];
  prohibition?: Prohibition[];
  obligation?: Duty[];
}

export interface Permission {
  '@type': 'Permission';
  target?: string;
  action: string;
  constraint?: Constraint[];
  duty?: Duty[];
}

export interface Prohibition {
  '@type': 'Prohibition';
  target?: string;
  action: string;
  constraint?: Constraint[];
}

export interface Duty {
  '@type': 'Duty';
  target?: string;
  action: string;
  constraint?: Constraint[];
}

export interface Constraint {
  '@type': 'Constraint';
  leftOperand: string;
  operator: string;
  rightOperand: any;
}

export interface DataAddress {
  '@type': 'DataAddress';
  type: string;
  endpoint?: string;
  properties?: Record<string, any>;
}

export interface QuerySpec {
  '@context'?: any;
  '@type': 'QuerySpec';
  offset?: number;
  limit?: number;
  filterExpression?: FilterExpression[];
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface FilterExpression {
  operandLeft: string;
  operator: string;
  operandRight: any;
}

export interface Dataset {
  '@type': 'dcat:Dataset';
  '@id': string;
  'dcat:keyword'?: string[];
  'dcat:theme'?: string[];
  'dcterms:title'?: string;
  'dcterms:description'?: string;
  'dcterms:creator'?: string;
  'dcterms:issued'?: string;
  'dcterms:modified'?: string;
  'dcat:distribution'?: Distribution[];
  'odrl:hasPolicy'?: OdrlPolicy[];
}

export interface Distribution {
  '@type': 'dcat:Distribution';
  '@id': string;
  'dcat:format'?: string;
  'dcat:mediaType'?: string;
  'dcat:accessURL'?: string;
  'dcat:downloadURL'?: string;
}

export interface DataService {
  '@type': 'dcat:DataService';
  '@id': string;
  'dcat:endpointURL': string;
  'dcat:servesDataset'?: string[];
}

// State Enums
export type ContractNegotiationState =
  | 'INITIAL'
  | 'REQUESTING'
  | 'REQUESTED'
  | 'OFFERING'
  | 'OFFERED'
  | 'ACCEPTING'
  | 'ACCEPTED'
  | 'AGREEING'
  | 'AGREED'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'FINALIZING'
  | 'FINALIZED'
  | 'TERMINATING'
  | 'TERMINATED';

export type TransferProcessState =
  | 'INITIAL'
  | 'PROVISIONING'
  | 'PROVISIONED'
  | 'REQUESTING'
  | 'REQUESTED'
  | 'STARTING'
  | 'STARTED'
  | 'COMPLETING'
  | 'COMPLETED'
  | 'DEPROVISIONING'
  | 'DEPROVISIONED'
  | 'TERMINATING'
  | 'TERMINATED';

// Error Types
export interface DataspaceError {
  code: string;
  message: string;
  details?: any;
}

export interface DataspaceConnectorEndpoints {
  management: {
    base: string;
    catalog: string;
    contractNegotiations: string;
    transferProcesses: string;
    assets: string;
    policies: string;
    contractDefinitions: string;
  };
  protocol: {
    base: string;
  };
}

// Event Types for real-time updates
export interface ContractNegotiationEvent {
  type: 'contract-negotiation';
  negotiationId: string;
  state: ContractNegotiationState;
  contractAgreementId?: string;
  errorDetail?: string;
}

export interface TransferProcessEvent {
  type: 'transfer-process';
  transferId: string;
  state: TransferProcessState;
  dataAddress?: DataAddress;
  errorDetail?: string;
}

export type DataspaceEvent = ContractNegotiationEvent | TransferProcessEvent;
