/**
 * @jest-environment jest-environment-jsdom-fourteen
 */
import {Store} from "../libs/store/store";


describe('Store Test', function() {
  test('add both', () => {
      let url = Store.paginatedUrl("http://foo.bar", 1, 3);
      expect(url).toBe("http://foo.bar/?page=1&offset=3");
  });

  test('add page', () => {
      let url = Store.paginatedUrl("http://foo.bar?page=14", 1, null);
      expect(url).toBe("http://foo.bar/?page=1");
  });

  test('add offset', () => {
      let url = Store.paginatedUrl("http://foo.bar?page=14", null, 1);
      expect(url).toBe("http://foo.bar/?page=14&offset=1");
  });
});
