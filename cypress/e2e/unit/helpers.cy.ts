import {
  uniqID,
  stringToDom,
  setDeepProperty,
  parseFieldsString,
  findClosingBracketMatchIndex,
  evalTemplateString,
  transformArrayToContainer
} from '../../../src/libs/helpers';

/**
 * uniqID
 */
describe('uniqID', function() {
  it('returns an id', () => {
    let test = uniqID();
    expect(test).to.match(/[_].{10}/g);
  });
  it('returns a different id 50 times in a row', () => {
    let ids: string[] = [];
    const arraySize = 50;
    for (let index = 0; index < arraySize; index++) {
      ids.push(uniqID());
    }
    let noDuplicates = [...new Set(ids)];
    expect(noDuplicates.length).to.eq(arraySize);
  });
});

/**
 * stringToDom
 */
describe('stringToDom', function() {
  it('returns a fragment', () => {
    const fragment = stringToDom('<h1>Test element</h1>');
    expect(fragment.constructor.name).to.eq('DocumentFragment');
  });

  it('returns a correct HTML DOM', () => {
    const fragment = stringToDom(
      '<div><span>1rst element</span><span>2nd element</span></div>',
    );
    expect(fragment.children.length).to.eq(1);
    // Test parent node
    expect(fragment.textContent).to.eq('1rst element2nd element');
    expect(fragment.children[0].tagName).to.eq('DIV');
    expect(fragment.children[0].childElementCount).to.eq(2);
    // Test first children
    expect(fragment.children[0].children[0].tagName).to.eq('SPAN');
    expect(fragment.children[0].children[0].textContent).to.eq('1rst element');
  });
});

/**
 * setDeepProperty
 */
describe('setDeepProperty', function() {
  it('set properties', () => {
    const object = {
      name: 'test',
      infos: {
        email: 'test',
        phone: 'test',
        address: {
          city: 'test',
          country: {
            code: 'test',
            name: 'test',
          },
        },
      },
    };

    setDeepProperty(object, ['infos', 'phone'], 'new phone');
    expect(object.infos.phone).to.eq('new phone');

    setDeepProperty(object, ['infos', 'address', 'city'], 'new city');
    expect(object.infos.address.city).to.eq('new city');

    setDeepProperty(object, ['infos', 'address', 'country'], {
      code: 'new code',
      name: 'new country',
    });
    expect(object.infos.address.country).to.deep.eq({
      code: 'new code',
      name: 'new country',
    });
  });
});

/**
 * parseFieldsString
 */
describe('parseFieldsString', function() {
  it('returns first level of fields', () => {
    const fields =
      'field1, field2(field3,field4, field5( field6, field7) ),  field8,field9';
    const fieldsParsed = parseFieldsString(fields);
    expect(fieldsParsed).to.be.deep.eq([
      'field1',
      'field2',
      'field8',
      'field9',
    ]);
  });
});

/**
 * findClosingBracketMatchIndex
 */
describe('findClosingBracketMatchIndex', function() {
  it('throw error', () => {
    const fields =
      'field1, field2(field3,field4, field5( field6, field7) ),  field8,field9';
    function findBracket() {
      findClosingBracketMatchIndex(fields, 2);
    }
    expect(findBracket).to.throw("No '(' at index 2");
  });

  it('find first (', () => {
    const fields =
      'field1, field2(field3,field4, field5( field6, field7) ),  field8,field9';
    expect(findClosingBracketMatchIndex(fields, 14)).to.eq(54);
  });

  it('find nested (', () => {
    const fields =
      'field1, field2(field3,field4, field5( field6, field7) ),  field8,field9';
    expect(findClosingBracketMatchIndex(fields, 36)).to.eq(52);
  });

  it('find second nested (', () => {
    const fields =
      'field1,field2(field3,field5(field6,field7)),field8,field9(field10(field11(field12)))';
    expect(findClosingBracketMatchIndex(fields, 73)).to.eq(81);
  });
});

/**
 * evalTemplateString
 */
describe('evalTemplateString', function() {
  it('render template with values', async () => {
    const values = {
      val1: 'test 1',
      val2: {
        val3: 3,
        val4: true,
      },
    };
    const template = `
    <div>
      <span>\${val1}</span>
      <span>\${val2.val3}</span>
      <span>\${val2.val4}</span>
    </div>
    `;
    const renderedDOM = await evalTemplateString(template, values);
    expect(typeof renderedDOM).to.eq('string');
    expect(renderedDOM).to.eq(`
    <div>
      <span>test 1</span>
      <span>3</span>
      <span>true</span>
    </div>
    `);
  });

  it('throws error', async () => {
    const values = {
      val1: 'test 1',
    };
    const template = `
    <div>
      <span>\${val2}</span>
    </div>
    `;
    const promise = new Cypress.Promise((resolve, reject) => {
      evalTemplateString(template, values)
        .then(resolve)
        .catch(reject);
    });
    promise.finally(() => {
      expect(promise.isRejected).to.be.true;
    });
  });
});

/**
 * evalTemplateString
 */
describe('transformArrayToContainer', function () {
  it('transforms simple resource', () => {
    const value = {
      "@id": "myresource",
      skills: [
        { "@id": "skill-1" },
        { "@id": "skill-2" }
      ]
    };
    const newValue = transformArrayToContainer(value);
    expect(newValue).to.deep.equal({
      "@id": "myresource",
      skills: {
        "ldp:contains": [
          { "@id": "skill-1" },
          { "@id": "skill-2" }
        ]
      }
    })
  })

  it('transforms container in nested resource', () => {
    const value = {
      "@id": "myresource",
      profile: {
        "@id": "profile",
        skills: [
          { "@id": "skill-1" },
          { "@id": "skill-2" }
        ]
      }
    };
    const newValue = transformArrayToContainer(value);
    expect(newValue).to.deep.equal({
      "@id": "myresource",
      profile: {
        "@id": "profile",
        skills: {
          "ldp:contains": [
            { "@id": "skill-1" },
            { "@id": "skill-2" }
          ]
        }
      }
    })
  })

  it('transforms nested container', () => {
    const value = {
      "@id": "myresource",
      skills: [
        {
          "@id": "skill-1",
          title: "HTML",
          members: [
            { "@id": "user-1" },
            { "@id": "user-2" }
          ]
        },
        {
          "@id": "skill-2",
          title: "CSS",
          members: [
            { "@id": "user-4" },
            { "@id": "user-5" }
          ]
        }
      ]
    };
    
    const newValue = transformArrayToContainer(value);
    expect(newValue).to.deep.equal({
      "@id": "myresource",
      skills: {
        "ldp:contains": [
          {
            "@id": "skill-1",
            title: "HTML",
            members: {
              "ldp:contains": [
                { "@id": "user-1" },
                { "@id": "user-2" }
              ]
            }
          },
          {
            "@id": "skill-2",
            title: "CSS",
            members: {
              "ldp:contains": [
                { "@id": "user-4" },
                { "@id": "user-5" }
              ]
            }
          }
        ]
      }
    })
  })
})
