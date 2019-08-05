/**
 * @jest-environment jest-environment-jsdom-fourteen
 */
import {Store} from "../libs/store/store";


describe('Store Test', function() {
  test('first page', () => {
      let url = Store.paginatedUrl("http://foo.bar", 1, 3);
      expect(url).toBe("http://foo.bar/?limit=3&offset=0");
  });

  test('second page', () => {
      let url = Store.paginatedUrl("http://foo.bar", 2, 10);
      expect(url).toBe("http://foo.bar/?limit=10&offset=10");
  });

  test('third page', () => {
      let url = Store.paginatedUrl("http://foo.bar?stuff=14", 3, 3);
      expect(url).toBe("http://foo.bar/?stuff=14&limit=3&offset=6");
  });
});
