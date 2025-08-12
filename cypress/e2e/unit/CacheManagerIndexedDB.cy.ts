import { IndexedDBCacheManager } from '../../../src/libs/store/cache/indexed-db.ts';

describe('IndexedDBCacheManager', () => {
  let cache: IndexedDBCacheManager = new IndexedDBCacheManager();

  beforeEach(async () => {
    // Clear existing IndexedDB stores before each test
    await cache.clear();
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
    const resource: any = { '@id': 'urn:test-id', name: 'Test Resource' };
    await cache.set('http://example.com/resource', resource);

    const id = await cache.getIdByUrl('http://example.com/resource');
    expect(id).to.equal('urn:test-id');
  });

  it('should link URL with ID using linkUrlWithId()', async () => {
    await cache.linkUrlWithId('/relative/path', {
      '@id': 'urn:test-id',
    } as any);

    const has = await cache.has('/relative/path');
    expect(has).to.equal(true);

    const id = await cache.getIdByUrl('/relative/path');
    expect(id).to.equal('urn:test-id');

    const resource = await cache.getById('urn:test-id');
    expect(resource).to.exist;
  });

  it('should delete resources correctly', async () => {
    const resource: any = { '@id': 'urn:test-id', name: 'Test Resource' };
    await cache.set('http://example.com/resource', resource);

    const deleted = await cache.delete('urn:test-id');
    expect(deleted).to.equal(true);

    const byId = await cache.getById('urn:test-id');
    expect(byId).to.be.undefined;

    const byUrl = await cache.getByUrl('http://example.com/resource');
    expect(byUrl).to.be.undefined;
  });

  it('should clear the cache', async () => {
    const resource: any = { '@id': 'urn:test-id', name: 'Test Resource' };
    await cache.set('http://example.com/resource', resource);

    await cache.clear();

    const count = await cache.length();
    expect(count).to.equal(0);
  });

  it('should report existence correctly via has()', async () => {
    const r = { '@id': 'urn:has', foo: true };
    await cache.set('/has', r as any);
    expect(await cache.has('urn:has')).to.be.true;
    expect(await cache.has('/has')).to.be.true;
    expect(await cache.has('nope')).to.be.false;
  });

  it('should keep correct length under mixed operations', async () => {
    await cache.clear();
    expect(await cache.length()).to.equal(0);

    await cache.set('/1', { '@id': 'u1' } as any);
    expect(await cache.length()).to.equal(1);

    await cache.set('/2', { '@id': 'u2' } as any);
    expect(await cache.length()).to.equal(2);

    await cache.delete('u2');
    expect(await cache.length()).to.equal(1);

    await cache.clear();
    expect(await cache.length()).to.equal(0);
  });

  it('should persist data after re-constructing manager', async () => {
    const r = { '@id': 'urn:persist', foo: 'bar' };
    await cache.set('/persist', r as any);

    // create new instance, should see the same DB
    cache = new IndexedDBCacheManager();
    expect(await cache.getById('urn:persist')).to.deep.equal(r);
  });
});
