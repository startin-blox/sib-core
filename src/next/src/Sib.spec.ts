/**
 * @jest-environment jest-environment-jsdom-fourteen
 */
import { Sib } from './Sib';

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
  },
  created() {
    (<any>this).message = 'hello ';
  },
  attached() {
    (<any>this).message = 'hooks respect ';
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
    (<any>this).message += 'world ';
  },
  detached() {
    (<any>this).message = 'and ';
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
        (this as any).change = true;
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
  },
  initialState: {
    c: {
      test: 0,
    },
    change: false,
    message: '',
  },
  created() {
    (<any>this).message += '!!';
  },
  attached() {
    (<any>this).message += 'order';
  },
  detached() {
    (<any>this).message += 'context';
  },
  methodC() {
    return 'C';
  },
  methodD() {
    (this as any).change = true;
  },
};

describe('Component factory', function() {
  test('expose html element', () => {
      Sib.register(Component);
      const el = document.createElement('app-comp');
      expect(el).toBeInstanceOf(HTMLElement);
  });
});
