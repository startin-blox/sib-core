export interface Provider {
  name: string;
  address: string;
  color?: string;
  logo?: string;
  participantId?: string; // DID or participant ID if known
}

export interface FederatedDataset {
  dataset: any;
  provider: Provider;
  catalogId: string;
  participantId: string;
}

export interface ProviderStatus {
  provider: Provider;
  datasetCount: number;
  status: 'success' | 'error';
  error?: string;
  lastUpdated: string;
}
