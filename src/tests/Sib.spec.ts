/**
 * @jest-environment jest-environment-jsdom-fourteen
 */
import { Sib } from '../libs/Sib';

const MixinTestTwo = {
  name: 'mixin2',
  use: [],
  attributes: {
    test: {
      type: String,
      default: 'test',
    },
  },
  initialState: {
    a: 0,
    accessorValue: "test"
  },
  get accessor() {
    return this.accessorValue;
  },
  set accessor(value) {
    this.accessorValue = value;
  },
  created() {
    this.message = 'hello ';
  },
  attached() {
    this.message = 'hooks respect ';
  },
  methodA() {
    console.log('methodAMixin2');
    return 'AA';
  },
  methodB() {
    return 'B';
  },
};

const MixinTestOne = {
  name: 'mixin1',
  use: [MixinTestTwo],
  attributes: {
    test: {
      type: Number,
      default: 0,
    },
  },
  initialState: {
    a: 1,
  },
  created() {
    this.message += 'world ';
  },
  detached() {
    this.message = 'and ';
  },
  methodA() {
    return 'A';
  },
  methodC() {
    console.log('methodCMixin1');
  },
};

const Component = {
  name: 'app-comp',
  use: [MixinTestOne],
  attributes: {
    myAttribute: {
      type: String,
      default: 'awesome',
      callback: function() {
        this.change = "new value";
      }
    },
    data: {
      type: Object,
      default: {
        hello: 'world',
      },
    },
    works: {
      type: Boolean,
      default: false,
    },
    required: {
      required: true,
    },
    dataChange: {
      type: String,
      default: "value"
    }
  },
  initialState: {
    c: {
      test: 0,
    },
    message: '',
  },
  created() {
    this.message += '!!';
  },
  attached() {
    this.message += 'order';
  },
  detached() {
    this.message += 'context';
  },
  methodC() {
    return 'C';
  },
  methodD() {
    this.change = true;
  },
};

describe('Component factory', function() {
  test('expose html element', () => {
      Sib.register(Component);
      const el = document.createElement('app-comp');
      expect(el).toBeInstanceOf(HTMLElement);
  });

  /*test('bind attribute with callback', () => {
    const el = document.createElement('app-comp');
    expect(el.getAttribute('data-change')).toEqual("value");
    el.setAttribute('my-attribute', "1");
    expect(el.getAttribute('data-change')).toEqual("new value");
  });*/
});
