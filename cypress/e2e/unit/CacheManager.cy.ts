// import { CacheManager } from '../../../src/libs/store/cache/cache-manager';

// describe('CacheManager', () => {
//   beforeEach(() => {
//     cy.visit('/examples/empty.html');
//     cy.window().then(win => {
//       // @ts-ignore
//       win.cache = new CacheManager();
//     });
//   });

//   it('should store and retrieve a resource by ID and URL', () => {
//     cy.window().then(win => {
//       const resource = { '@id': 'urn:test-id', name: 'Test Resource' };
//       win.cache.set('http://example.com/resource', resource as any);

//       expect(win.cache.getById('urn:test-id')).to.deep.equal(resource);
//       expect(win.cache.getByUrl('http://example.com/resource')).to.deep.equal(
//         resource,
//       );
//     });
//   });

//   it('should map URL to ID correctly', () => {
//     cy.window().then(win => {
//       const resource = { '@id': 'urn:test-id', name: 'Test Resource' };
//       win.cache.set('http://example.com/resource', resource as any);

//       expect(win.cache.getIdByUrl('http://example.com/resource')).to.equal(
//         'urn:test-id',
//       );
//     });
//   });

//   it('should link URL with ID using linkUrlWithId()', () => {
//     cy.window().then(win => {
//       win.cache.linkUrlWithId('/relative/path', {
//         '@id': 'urn:test-id',
//       } as any);

//       expect(win.cache.has('/relative/path')).to.equal(true);
//       expect(win.cache.getIdByUrl('/relative/path')).to.equal('urn:test-id');
//       expect(win.cache.getById('urn:test-id')).to.exist;
//     });
//   });

//   it('should delete resources correctly', () => {
//     cy.window().then(win => {
//       const resource = { '@id': 'urn:test-id', name: 'Test Resource' };
//       win.cache.set('http://example.com/resource', resource as any);

//       const deleted = win.cache.delete('urn:test-id');
//       expect(deleted).to.equal(true);
//       expect(win.cache.getById('urn:test-id')).to.be.undefined;
//       expect(win.cache.getByUrl('http://example.com/resource')).to.be.undefined;
//     });
//   });

//   it('should clear the cache', () => {
//     cy.window().then(win => {
//       const resource = { '@id': 'urn:test-id', name: 'Test Resource' };
//       win.cache.set('http://example.com/resource', resource as any);

//       win.cache.clear();

//       expect(win.cache.length()).to.equal(0);
//     });
//   });
// });
