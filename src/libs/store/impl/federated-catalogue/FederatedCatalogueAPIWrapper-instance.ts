import {
  FederatedCatalogueAPIWrapper,
  type KeycloakOptions,
  type KeycloakOptionsLogins,
  type KeycloakOptionsServer,
} from './FederatedCatalogueAPIWrapper.ts';

export function getFederatedCatalogueAPIWrapper(
  baseUrl: string,
  optionLogin: KeycloakOptionsLogins,
  optionsServer: KeycloakOptionsServer,
) {
  const options: KeycloakOptions = Object.assign(
    {},
    optionsServer,
    optionLogin,
  );
  return new FederatedCatalogueAPIWrapper(options, baseUrl);
}
