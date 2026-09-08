import { FederatedCatalogueDcpAPIWrapper } from './FederatedCatalogueDcpAPIWrapper.ts';

const instances = new Map<string, FederatedCatalogueDcpAPIWrapper>();

/**
 * Cached per (baseUrl, fetch identity) so the store doesn't re-create the
 * client on every getData call. `fetchImpl` identity is included so switching
 * from anon to authenticated fetch after login produces a fresh client.
 */
export function getFederatedCatalogueDcpAPIWrapper(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch.bind(globalThis),
): FederatedCatalogueDcpAPIWrapper {
  // key on baseUrl only — fetchImpl identity churns across renders and
  // caching against it would defeat the pool. Consumers wanting a fresh
  // client after auth changes should call the constructor directly.
  const key = baseUrl;
  let inst = instances.get(key);
  if (!inst) {
    inst = new FederatedCatalogueDcpAPIWrapper(baseUrl, fetchImpl);
    instances.set(key, inst);
  }
  return inst;
}
