/* eslint-disable @typescript-eslint/no-extraneous-class */
import { StoreFactory } from './StoreFactory.ts';
import type { IStore, StoreConfig, StoreInstance } from './shared/types.ts';
import { StoreType } from './shared/types.ts';

// biome-ignore lint/complexity/noStaticOnlyClass: utility class intended
export class StoreService {
  private static readonly DEFAULT_STORE_NAME = 'default';
  private static stores: Map<string, StoreInstance> = new Map();
  private static defaultStoreName = StoreService.DEFAULT_STORE_NAME;

  /**
   * Adds a new store instance to the manager.
   * @param name - The name for the new store instance.
   * @param config - The configuration for the new store.
   * @returns The created store instance.
   */
  public static addStore(name: string, config: StoreConfig): IStore<any> {
    if (StoreService.stores.has(name)) {
      console.warn(
        `[StoreService] Store with name "${name}" already exists. Overwriting.`,
      );
    }
    const store = StoreFactory.create(config);
    StoreService.stores.set(name, { store, config });
    return store;
  }

  /**
   * Retrieves a store instance by name. If no name is provided, it returns the default store.
   * @param name - The name of the store to retrieve.
   * @returns The store instance or null if not found.
   */
  public static getStore(name?: string): IStore<any> | null {
    const storeName = name || StoreService.defaultStoreName;
    if (!storeName) {
      return null;
    }
    const instance = StoreService.stores.get(storeName);
    if (!instance) {
      // Fallback for backward compatibility
      if (storeName === StoreService.defaultStoreName) {
        return StoreService.fallbackInitIfNeeded();
      }
      console.warn(`[StoreService] Store with name "${storeName}" not found.`);
      return null;
    }
    return instance.store;
  }

  /**
   * Sets the default store.
   * @param name - The name of the store to set as default.
   */
  public static setDefaultStore(name: string): void {
    if (!StoreService.stores.has(name)) {
      throw new Error(`[StoreService] Store with name "${name}" not found.`);
    }
    StoreService.defaultStoreName = name;
  }

  /**
   * Initialize the store service with a specific configuration.
   * This method is kept for backward compatibility and creates the 'default' store.
   * @param config
   * @returns
   */
  public static init(config?: StoreConfig): void {
    const storeConfig = config ?? { type: StoreType.LDP };
    StoreService.addStore(StoreService.defaultStoreName, storeConfig);
    StoreService.setDefaultStore(StoreService.defaultStoreName);
  }

  /**
   * Fallback initialization if no store has been set.
   * This creates a default LDP store instance and sets it as the global store.
   * @private
   * @returns {IStore<any>}
   */
  private static fallbackInitIfNeeded(): IStore<any> {
    let instance = StoreService.stores.get(StoreService.defaultStoreName);
    if (!instance) {
      const defaultConfig: StoreConfig = { type: StoreType.LDP };
      const store = StoreFactory.create(defaultConfig);
      instance = { store, config: defaultConfig };
      StoreService.stores.set(StoreService.defaultStoreName, instance);
    }
    return instance.store;
  }
  /**
   * Get the default store synchronously (creates default if missing)
   * @returns {IStore<any>} The current store instance.
   * @throws {Error} If the store type is not registered.
   * @deprecated Use `getStore('default')` instead. Maintained for backward compatibility.
   */
  public static getInstance(): IStore<any> {
    return StoreService.getStore('default') as IStore<any>;
  }

  /**
   * Get the configuration of a store.
   * @returns {StoreConfig | null} The store configuration or null if not found.
   */
  public static getConfig(name?: string): StoreConfig | null {
    const storeName = name || StoreService.defaultStoreName;
    const instance = StoreService.stores.get(storeName);
    return instance?.config || null;
  }
}
