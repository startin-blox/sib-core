export interface ProviderInfo {
  name: string;
  protocolAddress: string;
  participantId: string; // DID or participant identifier
  managementEndpoint?: string;
  description?: string;
  capabilities?: string[];
  lastSeen?: string;
  status?: 'online' | 'offline' | 'unknown';
}

export class ProviderRegistry {
  private providers: Map<string, ProviderInfo> = new Map();

  constructor(initialProviders?: ProviderInfo[]) {
    if (initialProviders) {
      for (const provider of initialProviders) {
        this.addProvider(provider);
      }
    }
  }

  /**
   * Add or update a provider in the registry
   */
  addProvider(provider: ProviderInfo): void {
    this.providers.set(provider.protocolAddress, provider);
  }

  /**
   * Get provider info by protocol address
   */
  getProviderByAddress(protocolAddress: string): ProviderInfo | undefined {
    return this.providers.get(protocolAddress);
  }

  /**
   * Get provider info by participant ID
   */
  getProviderByParticipantId(participantId: string): ProviderInfo | undefined {
    return Array.from(this.providers.values()).find(
      provider => provider.participantId === participantId,
    );
  }

  /**
   * Get all providers
   */
  getAllProviders(): ProviderInfo[] {
    return Array.from(this.providers.values());
  }

  /**
   * Remove a provider
   */
  removeProvider(protocolAddress: string): boolean {
    return this.providers.delete(protocolAddress);
  }

  /**
   * Update provider status (for health monitoring)
   */
  updateProviderStatus(
    protocolAddress: string,
    status: 'online' | 'offline' | 'unknown',
  ): void {
    const provider = this.providers.get(protocolAddress);
    if (provider) {
      provider.status = status;
      provider.lastSeen = new Date().toISOString();
    }
  }

  /**
   * Load providers from JSON configuration
   */
  static fromConfig(config: { providers: ProviderInfo[] }): ProviderRegistry {
    return new ProviderRegistry(config.providers);
  }

  /**
   * Export current registry to JSON
   */
  toConfig(): { providers: ProviderInfo[] } {
    return {
      providers: this.getAllProviders(),
    };
  }
}
