import {
  FederatedCatalogueAPIWrapper,
  type KeycloakLoginOptions,
} from './FederatedCatalogueAPIWrapper.ts';

export function getFederatedCatalogueAPIWrapper(
  baseUrl: string,
  loginOptions: KeycloakLoginOptions
) {
  return new FederatedCatalogueAPIWrapper(loginOptions, baseUrl);
}
