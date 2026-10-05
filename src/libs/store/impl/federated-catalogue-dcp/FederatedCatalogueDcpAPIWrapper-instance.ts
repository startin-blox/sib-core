import { FederatedCatalogueDcpAPIWrapper } from './FederatedCatalogueDcpAPIWrapper.ts';

const instances = new Map<string, FederatedCatalogueDcpAPIWrapper>();

export function getFederatedCatalogueDcpAPIWrapper(
  baseUrl: string,
  fetchImpl?: typeof fetch,
  apiKey?: string,
): FederatedCatalogueDcpAPIWrapper {
  const resolvedFetch = fetchImpl ?? fetch.bind(globalThis);
  const key = `${baseUrl}::${apiKey ?? ''}::${fetchImpl ? 'auth' : 'anon'}`;
  let inst = instances.get(key);
  if (!inst) {
    inst = new FederatedCatalogueDcpAPIWrapper(baseUrl, resolvedFetch, {
      apiKey,
    });
    instances.set(key, inst);
  }
  return inst;
}
