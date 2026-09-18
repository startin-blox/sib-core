import { FederatedCatalogueDcpAPIWrapper } from './FederatedCatalogueDcpAPIWrapper.ts';

const instances = new Map<string, FederatedCatalogueDcpAPIWrapper>();

// Pool keyed by (baseUrl, apiKey) so flipping auth mode picks up a fresh wrapper.
export function getFederatedCatalogueDcpAPIWrapper(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch.bind(globalThis),
  apiKey?: string,
): FederatedCatalogueDcpAPIWrapper {
  const key = `${baseUrl}::${apiKey ?? ''}`;
  let inst = instances.get(key);
  if (!inst) {
    inst = new FederatedCatalogueDcpAPIWrapper(baseUrl, fetchImpl, { apiKey });
    instances.set(key, inst);
  }
  return inst;
}
