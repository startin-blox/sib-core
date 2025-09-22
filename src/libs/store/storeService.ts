/* eslint-disable @typescript-eslint/no-extraneous-class */
import { StoreFactory } from './StoreFactory.ts';
import type { IStore, StoreConfig } from './shared/types.ts';
import { StoreType } from './shared/types.ts';

// biome-ignore lint/complexity/noStaticOnlyClass: utility class intended
export class StoreService {
  private static currentStore: IStore<any> | null = null;
  private static currentConfig: StoreConfig | null = null;

  /**
   * Initialize the store service with a specific configuration.
   * If no configuration is provided, it defaults to a basic LDP store.
   * This method should be called once, typically at application startup.
   * @param config
   * @returns
   */
  public static init(config?: StoreConfig): void {
    if (StoreService.currentStore) {
      console.warn(
        '[StoreService] Store already initialized. Ignoring duplicate init.',
      );
      return;
    }

    StoreService.currentConfig = config ?? { type: StoreType.LDP };
    const store = StoreFactory.create(StoreService.currentConfig);
    StoreService.currentStore = store;
  }

  /**
   * Fallback initialization if no store has been set.
   * This creates a default LDP store instance and sets it as the global store.
   * This is useful for cases where the store might not have been initialized
   * before accessing it, such as in tests or early application load.
   * @private
   * @returns {void}
   * @remarks
   * This method ensures that there is always a store instance available,
   * even if the application did not explicitly initialize one.
   */
  private static fallbackInitIfNeeded(): IStore<any> {
    if (!StoreService.currentStore) {
      const defaultConfig: StoreConfig = { type: StoreType.LDP };
      const store = StoreFactory.create(defaultConfig);
      StoreService.currentStore = store;
      StoreService.currentConfig = defaultConfig;
    }

    return StoreService.currentStore; // If already initialized, return the current store
  }

  /**
   * Get the store synchronously (creates default if missing)
   * @returns {IStore<any>} The current store instance.
   * @throws {Error} If the store type is not registered.
   */
  public static getInstance(): IStore<any> {
    if (StoreService.currentStore) return StoreService.currentStore;

    const store = StoreService.fallbackInitIfNeeded();
    return store;
  }

  /**
   * Get the current store configuration.
   * @returns {StoreConfig | null} The current store configuration or null if not set.
   */
  public static getConfig(): StoreConfig | null {
    return StoreService.currentConfig;
  }
}
