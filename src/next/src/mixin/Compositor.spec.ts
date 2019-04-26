import { Compositor } from './Compositor';

const MixinTestTwo = {
  name: 'mixin2',
  use: [],
  attributes: {
    test: {
      type: Number
    },
  },
  initialState: {
    a: 0,
  },
  created() {
    console.log('created2');
  },
  attached() {
    console.log('attached2');
  },
  methodA() {
    console.log('methodAMixin2');
  },
  methodB() {
    console.log('methodBMixin2');
  },
};

const MixinTestOne = {
  name: 'mixin1',
  use: [MixinTestTwo],
  attributes: {
    test: {
      type: String,
    },
  },
  initialState: {
    b: 0,
  },
  created() {
    console.log('created1');
  },
  detached() {
    console.log('detached2');
  },
  methodA() {
    console.log('methodAMixin1');
  },
  methodC() {
    console.log('methodCMixin1');
  },
};

const component = {
  name: 'comp',
  use: [MixinTestOne],
  attributes: {
    myAttribute: {
      type: String,
    },
  },
  initialState: {
    c: {
      test: 0,
    },
  },
  created() {
    console.log('created3');
  },
  attached() {
    console.log('attached3');
  },
  detached() {
    console.log('detached3');
  },
  methodC() {
    console.log('methodCComponent');
  },
  methodD() {
    console.log('methodDComponent');
  },
};

describe('Mixin Compositor', function() {
  test('merge mixin', () => {
    const result = Compositor.mergeMixin(component);
    expect(result.length).toEqual(2);
    expect(result[0].name).toEqual('mixin1');
    expect(result[1].name).toEqual('mixin2');
  });

  test('merge attributes', () => {
    const result = Compositor.mergeAttributes([component, MixinTestOne, MixinTestTwo]);
    expect(Reflect.ownKeys(result).length).toEqual(2);
    expect(result.myAttribute.type).toEqual(String);
    expect(result.test.type).toEqual(String);
  });

  test('merge initial state', () => {
    const result = Compositor.mergeInitialState([component, MixinTestOne, MixinTestTwo]);
    expect(Reflect.ownKeys(result).length).toEqual(3);
    expect(result.a).toEqual(0);
    expect(result.b).toEqual(0);
    expect(result.c.test).toEqual(0);
  });

  test('merge hooks', () => {
    const result = Compositor.mergeHooks([component, MixinTestOne, MixinTestTwo]);
    const hookNames = Reflect.ownKeys(result);

    expect(hookNames.length).toEqual(3);
    hookNames.forEach(hookName => {
      result[hookName].forEach(hook => {
        expect(typeof hook).toEqual('function');
      });
    });

    expect(result.created.length).toEqual(3);
    expect(result.attached.length).toEqual(2);
    expect(result.detached.length).toEqual(2);

    expect(result.created[0].toString()).toEqual(MixinTestTwo.created.toString());
    expect(result.created[1].toString()).toEqual(MixinTestOne.created.toString());
    expect(result.created[2].toString()).toEqual(component.created.toString());
  });

  test('merge methods', () => {
    const result = Compositor.mergeMethods([component, MixinTestOne, MixinTestTwo]);
    const methodNames = Array.from(result.keys());

    expect(methodNames.length).toEqual(4);
    methodNames.forEach(methodName => {
      expect(typeof result.get(methodName)).toEqual('function');
    });

    expect(result.get('methodA').toString()).toEqual(MixinTestOne.methodA.toString());
    expect(result.get('methodB').toString()).toEqual(MixinTestTwo.methodB.toString());
    expect(result.get('methodC').toString()).toEqual(component.methodC.toString());
    expect(result.get('methodD').toString()).toEqual(component.methodD.toString());
  });
});
