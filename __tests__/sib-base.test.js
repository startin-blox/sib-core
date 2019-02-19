describe('SiB Base Tests', () => {
  beforeAll(() => {
    window["MyStore"] = function () {
    };
    window["customElements"] = {
      define: function () {
      }
    };
    sibBase = require('../sib-base');
  });

  test('eval template string', () => {
    const name = "key";
    const value = "data";

    expect(sibBase.evalTemplateString("${name} - ${value}", {name, value})).toBe("key - data");
  });
});