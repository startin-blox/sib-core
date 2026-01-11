import { FederatedCatalogueAPIWrapper } from './FederatedCatalogueAPIWrapper.ts';

export function getFederatedCatalogueAPIWrapper(
  baseUrl: string,
  fetch?: (
    input: RequestInfo,
    init?: RequestInit | undefined,
  ) => Promise<Response>,
) {
  return new FederatedCatalogueAPIWrapper(baseUrl, fetch);
}
