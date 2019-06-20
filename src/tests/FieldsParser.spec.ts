import { parseFieldsStringNew } from '../libs/helpers';

const tests: [string, object[]][] = [
  ['foo', [{ name: 'foo', path: ['foo'] }]],
  ['foo.bar', [{ name: 'foo.bar', path: ['foo', 'bar'] }]],
  ['foo.bar as foobar', [{ name: 'foobar', path: ['foo', 'bar'] }]],
  [
    'foo, bar',
    [{ name: 'foo', path: ['foo'] }, { name: 'bar', path: ['bar'] }],
  ],
  [
    '(foo, foo.bar as baz) as foobar',
    [
      {
        name: 'foobar',
        set: [
          {
            name: 'foo',
            path: ['foo'],
          },
          {
            name: 'baz',
            path: ['foo', 'bar'],
          },
        ],
      },
    ],
  ],
];

describe('fields parser', () => {
  test.each(tests)('parseField(%s)', (a, b) => {
    expect(parseFieldsStringNew(a as string)).toEqual(b);
  });
});
