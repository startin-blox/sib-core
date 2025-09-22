import { type IStore, type StoreConfig, StoreType } from './shared/types.ts';
import { LdpStoreAdapter } from './impl/ldp/LdpStoreAdapter.ts';
import { DataspaceConnectorStoreAdapter } from './impl/dataspace-connector/DataspaceConnectorStore.ts';
import { FederatedCatalogueStoreAdapter } from './impl/federated-catalogue/FederatedCatalogueStore.ts';

type StoreAdapterConstructor = {
  getStoreInstance(cfg: StoreConfig): IStore<any>;
};

export namespace StoreFactory {
  const registry = new Map<string, StoreAdapterConstructor>();

  export function register(name: string, adapter: StoreAdapterConstructor) {
    registry.set(name, adapter);
  }

  export function create(cfg: StoreConfig): IStore<any> {
    const Adapter = registry.get(cfg.type);
    if (!Adapter) throw new Error(`Store type "${cfg.type}" not registered`);
    return Adapter.getStoreInstance(cfg);
  }
}

StoreFactory.register(StoreType.LDP, LdpStoreAdapter);
StoreFactory.register(
  StoreType.FederatedCatalogue,
  FederatedCatalogueStoreAdapter,
);
StoreFactory.register(
  StoreType.DataspaceConnector,
  DataspaceConnectorStoreAdapter,
);
