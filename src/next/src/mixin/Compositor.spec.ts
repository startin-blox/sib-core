import { expect } from 'chai';
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
  it('merge mixin', () => {
    const result = Compositor.mergeMixin(component);
    expect(result.length).equal(2);
    expect(result[0].name).equal('mixin1');
    expect(result[1].name).equal('mixin2');
  });

  it('merge attributes', () => {
    const result = Compositor.mergeAttributes([component, MixinTestOne, MixinTestTwo]);
    expect(Reflect.ownKeys(result).length).equal(2);
    expect(result.myAttribute.type).equal(String);
    expect(result.test.type).equal(String);
  });

  it('merge initial state', () => {
    const result = Compositor.mergeInitialState([component, MixinTestOne, MixinTestTwo]);
    expect(Reflect.ownKeys(result).length).equal(3);
    expect(result.a).equal(0);
    expect(result.b).equal(0);
    expect(result.c.test).equal(0);
  });

  it('merge hooks', () => {
    const result = Compositor.mergeHooks([component, MixinTestOne, MixinTestTwo]);
    const hookNames = Reflect.ownKeys(result);

    expect(hookNames.length).equal(3);
    hookNames.forEach(hookName => {
      result[hookName].forEach(hook => {
        expect(typeof hook).equal('function');
      });
    });

    expect(result.created.length).equal(3);
    expect(result.attached.length).equal(2);
    expect(result.detached.length).equal(2);

    expect(result.created[0].toString()).equal(MixinTestTwo.created.toString());
    expect(result.created[1].toString()).equal(MixinTestOne.created.toString());
    expect(result.created[2].toString()).equal(component.created.toString());
  });

  it('merge methods', () => {
    const result = Compositor.mergeMethods([component, MixinTestOne, MixinTestTwo]);
    const methodNames = Array.from(result.keys());

    expect(methodNames.length).equal(4);
    methodNames.forEach(methodName => {
      expect(typeof result.get(methodName)).equal('function');
    });

    expect(result.get('methodA').toString()).equal(MixinTestOne.methodA.toString());
    expect(result.get('methodB').toString()).equal(MixinTestTwo.methodB.toString());
    expect(result.get('methodC').toString()).equal(component.methodC.toString());
    expect(result.get('methodD').toString()).equal(component.methodD.toString());
  });
});
