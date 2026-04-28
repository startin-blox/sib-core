import type { StoreConfig } from '../../shared/types.ts';

/**
 * Custom error for asset validation failures (e.g., cannot update/delete due to agreements)
 * This error is dispatched as an event that the UI can catch to show validation popups
 */
export class AssetValidationError extends Error {
  public readonly assetId: string;
  public readonly validationType: 'update' | 'delete';
  public readonly reason: 'agreements' | 'negotiations';
  public readonly details?: any;

  constructor(
    message: string,
    assetId: string,
    validationType: 'update' | 'delete',
    reason: 'agreements' | 'negotiations',
    details?: any,
  ) {
    super(message);
    this.name = 'AssetValidationError';
    this.assetId = assetId;
    this.validationType = validationType;
    this.reason = reason;
    this.details = details;
  }
}

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
  edrsEndpoint?: string; // /v3/edrs
  publicEndpoint?: string; // /public

  // API version
  apiVersion?: 'v2' | 'v3'; // Default to v3

  // Authentication - Dataspace Protocol specific
  authMethod: 'dsp-api-key' | 'bearer' | 'oauth2' | 'delegated';

  // DSP API Key authentication (most common)
  dspApiKey?: string;

  // Standard authentication methods
  bearerToken?: string;
  oauth2Config?: OAuth2Config;

  // Server-side token proxy endpoint for dual-header mode (dsp-api-key + Bearer).
  // Nginx proxies a client_credentials grant to participant Keycloak,
  // injecting the client secret server-side. The browser never sees the secret.
  bearerTokenProxyEndpoint?: string;

  // Local Keycloak configuration for silent OIDC token acquisition.
  // Uses iframe-based silent auth to get user-specific tokens (not service account).
  // This leverages the user's existing SSO session with local Keycloak.
  // DEPRECATED: Use linkedProviderId with sib-auth-linked-provider instead.
  localKeycloakConfig?: LocalKeycloakConfig;

  // ID of the sib-auth linked provider to use for Bearer token acquisition.
  // This is the preferred approach - configure a <sib-auth-linked-provider data-id="...">
  // in your HTML and reference it here. The linked provider handles silent OIDC auth.
  linkedProviderId?: string;

  // EDC Delegated Authentication Service
  delegatedAuthConfig?: DelegatedAuthConfig;

  // Optional configuration
  participantId?: string;
  timeout?: number;
  retryAttempts?: number;

  /** DSP wire protocol identifier sent in negotiation/transfer requests. Defaults to "dataspace-protocol-http" (v0.8). Set to "dataspace-protocol-http:2025-1" to use the 2025-1 binding. */
  dspProtocol?: string;

  // Optional additional JSON-LD context entries merged into every request's @context.
  // Example: { 'dcterms': 'http://purl.org/dc/terms/', 'dcat': 'http://www.w3.org/ns/dcat#' }
  additionalContext?: Record<string, string>;
}

export interface OAuth2Config {
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}

/**
 * Configuration for local Keycloak silent OIDC authentication.
 * Used to acquire user-specific tokens via iframe-based silent auth,
 * leveraging the user's existing SSO session.
 */
export interface LocalKeycloakConfig {
  /** Keycloak realm URL, e.g., "http://localhost:8080/auth/realms/edc" */
  authority: string;
  /** Public OIDC client ID, e.g., "catalog-ui-silent" */
  clientId: string;
  /** OIDC scopes to request, defaults to "openid profile" */
  scope?: string;
  /** Silent callback URL - must be served and registered in Keycloak redirect URIs.
   * Defaults to window.location.origin + '/silent-callback.html'.
   * For dev environments where serving static files is difficult, point this to nginx. */
  silentRedirectUri?: string;
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
  protocol: string;
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
  '@context':
    | string[]
    | Record<string, string>
    | (string | Record<string, string>)[];
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
  '@context':
    | string[]
    | Record<string, string>
    | (string | Record<string, string>)[];
  '@type':
    | 'https://w3id.org/edc/v0.0.1/ns/CatalogRequestMessage'
    | 'CatalogRequestMessage';
  counterPartyAddress: string;
  protocol: string;
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

// Contract Agreement Types
export interface ContractAgreement {
  '@type': 'ContractAgreement';
  '@id': string;
  '@context': any;
  assetId: string;
  policy: OdrlPolicy;
  contractSigningDate: number;
  consumerId: string;
  providerId: string;
}

// EDR (Endpoint Data Reference) Types
export interface EDRRequest {
  '@context'?: any;
  '@type'?: 'https://w3id.org/edc/v0.0.1/ns/TransferRequest';
  assetId: string;
  protocol: string;
  counterPartyAddress: string;
  contractId: string;
  transferType: 'HttpData-PULL';
  dataDestination: {
    type: 'HttpProxy';
  };
}

export interface EDRResponse {
  '@type': 'IdResponse';
  '@id': string;
  '@context': any;
  createdAt: number;
}

export interface EDRDataAddress {
  '@type': 'DataAddress';
  '@context': any;
  type: 'https://w3id.org/idsa/v4.1/HTTP';
  endpoint: string;
  authType: 'bearer';
  endpointType: 'https://w3id.org/idsa/v4.1/HTTP';
  authorization: string; // JWT token
}

// Asset-Agreement mapping for storage
export interface AssetAgreementMapping {
  assetId: string;
  /** Provider participant ID to differentiate assets with the same ID from different providers */
  providerParticipantId?: string;
  catalogId?: string;
  agreementId: string;
  agreement: ContractAgreement;
  negotiationId: string;
  transferId?: string;
  edrToken?: string;
  createdAt: number;
  lastUpdated: number;
}

// Asset Management Types (EDC v3)
export interface Asset {
  '@type': 'Asset';
  '@id': string;
  '@context'?: any;
  properties?: Record<string, any>;
  dataAddress?: DataAddress;
  createdAt?: number;
}

export interface AssetInput {
  '@id': string;
  properties?: Record<string, any>;
  dataAddress?: DataAddress;
}

// Policy Definition Management Types (EDC v3)
export interface PolicyDefinition {
  '@type': 'PolicyDefinition';
  '@id': string;
  '@context'?: any;
  policy: OdrlPolicy;
  createdAt?: number;
}

export interface PolicyDefinitionInput {
  '@id': string;
  policy: OdrlPolicy;
}

// Contract Definition Management Types (EDC v3)
export interface ContractDefinition {
  '@type': 'ContractDefinition';
  '@id': string;
  '@context'?: any;
  accessPolicyId: string;
  contractPolicyId: string;
  assetsSelector?: AssetSelector[];
  createdAt?: number;
}

export interface ContractDefinitionInput {
  '@id': string;
  accessPolicyId: string;
  contractPolicyId: string;
  assetsSelector?: AssetSelector[];
}

export interface AssetSelector {
  '@type': 'CriterionDto';
  operandLeft: string;
  operator: string;
  operandRight: any;
}
