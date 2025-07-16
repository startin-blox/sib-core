import { InMemoryCacheManager } from '../../../src/libs/store/cache/in-memory.ts';

describe('InMemoryCacheManager', () => {
  const cache: InMemoryCacheManager = new InMemoryCacheManager();

  beforeEach(() => {
    cache.clear();
  });

  it('should store and retrieve a resource by ID and URL', async () => {
    const resource = { '@id': 'urn:test-id', name: 'Test Resource' };
    await cache.set('http://example.com/resource', resource as any);

    const byId = await cache.getById('urn:test-id');
    const byUrl = await cache.getByUrl('http://example.com/resource');

    expect(byId).to.deep.equal(resource);
    expect(byUrl).to.deep.equal(resource);
  });

  it('should map URL to ID correctly', async () => {
    const resource = { '@id': 'urn:test-id', name: 'Test Resource' };
    await cache.set('http://example.com/resource', resource as any);

    const id = await cache.getIdByUrl('http://example.com/resource');
    expect(id).to.equal('urn:test-id');
  });

  it('should link URL with ID using linkUrlWithId()', async () => {
    await cache.linkUrlWithId('/relative/path', {
      '@id': 'urn:test-id',
    } as any);

    const has = await cache.has('/relative/path');
    const id = await cache.getIdByUrl('/relative/path');
    const byId = await cache.getById('urn:test-id');

    expect(has).to.equal(true);
    expect(id).to.equal('urn:test-id');
    expect(byId).to.exist;
  });

  it('should delete resources correctly', async () => {
    const resource = { '@id': 'urn:test-id', name: 'Test Resource' };
    await cache.set('http://example.com/resource', resource as any);

    const deleted = await cache.delete('urn:test-id');
    expect(deleted).to.equal(true);

    const byId = await cache.getById('urn:test-id');
    const byUrl = await cache.getByUrl('http://example.com/resource');

    expect(byId).to.be.undefined;
    expect(byUrl).to.be.undefined;
  });

  it('should clear the cache', async () => {
    const resource = { '@id': 'urn:test-id', name: 'Test Resource' };
    await cache.set('http://example.com/resource', resource as any);

    await cache.clear();
    const len = await cache.length();
    expect(len).to.equal(0);
  });

  it('should update a resource when set with the same @id', async () => {
    const initial: any = { '@id': 'urn:test', name: 'Initial' };
    const updated: any = { '@id': 'urn:test', name: 'Updated' };
    await cache.set('http://example.com/res', initial);
    await cache.set('http://example.com/res', updated);

    const result: any = await cache.getById('urn:test');
    expect(result?.name).to.equal('Updated');
  });

  it('should support multiple URLs mapping to the same @id', async () => {
    const resource: any = { '@id': 'urn:multi', name: 'Shared' };
    await cache.set('http://url1.com', resource);
    await cache.linkUrlWithId('http://url2.com', resource);

    const res1 = await cache.getByUrl('http://url1.com');
    const res2 = await cache.getByUrl('http://url2.com');

    expect(res1).to.deep.equal(resource);
    expect(res2).to.deep.equal(resource);
  });

  it('should not store resource without @id', async () => {
    const invalid: any = { name: 'Invalid' }; // missing @id
    await cache.set('http://example.com/invalid', invalid);
    const result = await cache.getByUrl('http://example.com/invalid');
    expect(result).to.be.undefined;
  });
});
