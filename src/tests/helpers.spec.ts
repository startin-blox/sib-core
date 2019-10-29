import {
  uniqID,
  stringToDom,
  setDeepProperty,
  parseFieldsString,
  findClosingBracketMatchIndex,
  evalTemplateString,
  importCSS,
  importJS,
  defineComponent
} from '../libs/helpers.js';

/**
 * uniqID
 */
describe('uniqID', function() {
  test('returns an id', () => {
    let test = uniqID();
    expect(test).toMatch(/[_].{10}/g)
  });

  test('returns a different id 50 times in a row', () => {
    let ids: string[] = [];
    const arraySize = 50;
    for (let index = 0; index < arraySize; index++) {
      ids.push(uniqID());
    }
    let noDuplicates = [...new Set(ids)];
    expect(noDuplicates.length).toBe(arraySize);
  });
});

/**
 * stringToDom
 */
describe('stringToDom', function () {
  test('returns a fragment', () => {
    const fragment = stringToDom('<h1>Test element</h1>');
    expect(fragment.constructor.name).toBe('DocumentFragment');
  });

  test('returns a correct HTML DOM', () => {
    const fragment = stringToDom('<div><span>1rst element</span><span>2nd element</span></div>');
    expect(fragment.children.length).toBe(1);
    // Test parent node
    expect(fragment.textContent).toBe("1rst element2nd element");
    expect(fragment.children[0].tagName).toBe("DIV");
    expect(fragment.children[0].childElementCount).toBe(2);
    // Test first children
    expect(fragment.children[0].children[0].tagName).toBe("SPAN");
    expect(fragment.children[0].children[0].textContent).toBe("1rst element");

  });
});

/**
 * setDeepProperty
 */
describe('setDeepProperty', function () {
  test('set properties', () => {
    const object = {
      name: "test",
      infos: {
        email: "test",
        phone: "test",
        address: {
          city: "test",
          country: {
            code: "test",
            name: "test"
          }
        }
      }
    }

    setDeepProperty(object, ["infos", "phone"], "new phone");
    expect(object.infos.phone).toBe('new phone');

    setDeepProperty(object, ["infos", "address", "city"], "new city");
    expect(object.infos.address.city).toBe('new city');

    setDeepProperty(object, ["infos", "address", "country"], {code:"new code", name: "new country"});
    expect(object.infos.address.country.code).toBe('new code');
    expect(object.infos.address.country.name).toBe('new country');
  });
});

/**
 * parseFieldsString
 */
describe('parseFieldsString', function () {
  test('returns first level of fields', () => {
    const fields = "field1, field2(field3,field4, field5( field6, field7) ),  field8,field9";
    const fieldsParsed = parseFieldsString(fields);
    expect(fieldsParsed).toEqual(['field1', 'field2', 'field8', 'field9'])
  });
});

/**
 * findClosingBracketMatchIndex
 */
describe('findClosingBracketMatchIndex', function () {
  test('throw error', () => {
    const fields = "field1, field2(field3,field4, field5( field6, field7) ),  field8,field9";
    function findBracket() {
      findClosingBracketMatchIndex(fields, 2);
    }
    expect(findBracket).toThrowError(new Error("No '(' at index 2"));
  });

  test('find first (', () => {
    const fields = "field1, field2(field3,field4, field5( field6, field7) ),  field8,field9";
    expect(findClosingBracketMatchIndex(fields, 14)).toBe(54);
  });

  test('find nested (', () => {
    const fields = "field1, field2(field3,field4, field5( field6, field7) ),  field8,field9";
    expect(findClosingBracketMatchIndex(fields, 36)).toBe(52);
  });

  test('find second nested (', () => {
    const fields = "field1,field2(field3,field5(field6,field7)),field8,field9(field10(field11(field12)))";
    expect(findClosingBracketMatchIndex(fields, 73)).toBe(81);
  });
});

/**
 * evalTemplateString
 */
describe('evalTemplateString', function () {
  test('render template with values', async () => {
    const values = {
      val1: "test 1",
      val2: {
        val3: 3,
        val4: true
      }
    };
    const template = `
    <div>
      <span>\${val1}</span>
      <span>\${val2.val3}</span>
      <span>\${val2.val4}</span>
    </div>
    `;
    const renderedDOM = await evalTemplateString(template, values);
    expect(typeof renderedDOM).toBe('string');
    expect(renderedDOM).toBe(`
    <div>
      <span>test 1</span>
      <span>3</span>
      <span>true</span>
    </div>
    `);
  });

  test('throws error', async () => {
    const values = {
      val1: "test 1"
    };
    const template = `
    <div>
      <span>\${val2}</span>
    </div>
    `;
    expect(evalTemplateString(template, values)).rejects.toEqual(new SyntaxError('`' + template + '`'));
  });
});

/**
 * importCSS
 */
describe('importCSS', function () {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  test('add one stylesheet', () => {
    importCSS('https://unpkg.com/@startinblox/component-notifications@0.3.0/css/notification.css');
    expect(document.head.innerHTML).toBe('<link rel="stylesheet" href="https://unpkg.com/@startinblox/component-notifications@0.3.0/css/notification.css">');
  });

  test('add multiple stylesheet', () => {
    importCSS(
      'https://unpkg.com/@startinblox/component-notifications@0.3.0/css/notification.css',
      'https://unpkg.com/@startinblox/component-notifications@0.3.0/css/badge.css'
    );
    expect(document.head.innerHTML).toBe(`<link rel="stylesheet" href="https://unpkg.com/@startinblox/component-notifications@0.3.0/css/notification.css"><link rel="stylesheet" href="https://unpkg.com/@startinblox/component-notifications@0.3.0/css/badge.css">`);
  });

  test('add stylesheet only once', () => {
    importCSS(
      'https://unpkg.com/@startinblox/component-notifications@0.3.0/css/notification.css',
      'https://unpkg.com/@startinblox/component-notifications@0.3.0/css/notification.css'
    );
    expect(document.head.innerHTML).toBe(`<link rel="stylesheet" href="https://unpkg.com/@startinblox/component-notifications@0.3.0/css/notification.css">`);
  });
});

/**
 * importJS
 */
describe('importJS', function () {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  test('add one script', () => {
    importJS('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js');
    expect(document.head.innerHTML).toBe('<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js"></script>');
  });

  test('add multiple scripts', () => {
    importJS(
      'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/core.js'
    );
    expect(document.head.innerHTML).toBe('<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/core.js"></script>');
  });

  test('add script only once', () => {
    importJS(
      'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js'
    );
    expect(document.head.innerHTML).toBe('<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js"></script>');
  });
});

/**
 * defineComponent
 */
describe('defineComponent', function () {
  test('define my-component', () => {
    expect(customElements.get("my-component")).toBeUndefined();
    defineComponent("my-component", class extends HTMLElement { });
    expect(customElements.get("my-component")).toBeDefined();
  });

  test('show a warning', () => {
    const spy = jest.spyOn(console, "warn")
    defineComponent("my-component", class extends HTMLElement { });
    expect(spy).toHaveBeenCalled();
  });
});
