// Universal auth integration without dependencies on specific implementations
export {
  AuthFetchResolver,
  DEFAULT_AUTH_SELECTORS,
} from './AuthFetchResolver.ts';

export { LocalKeycloakAuthManager } from './LocalKeycloakAuthManager.ts';
export type { LocalKeycloakConfig } from '../impl/dataspace-connector/types.ts';
