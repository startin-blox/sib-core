import {
  FederatedCatalogueAPIWrapper,
  type KeycloakLoginOptions,
} from './FederatedCatalogueAPIWrapper.ts';

export function getFederatedCatalogueAPIWrapper(
  baseUrl: string,
  loginOptions: KeycloakLoginOptions,
  fetch?: (
    input: RequestInfo | URL,
    init?: RequestInit | undefined,
  ) => Promise<Response>,
) {
  return new FederatedCatalogueAPIWrapper(loginOptions, baseUrl, fetch);
}
