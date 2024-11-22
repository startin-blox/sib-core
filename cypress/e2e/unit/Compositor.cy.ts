import { Compositor } from '../../../src/libs/Compositor';

const MixinTestTwo = {
  name: 'mixin2',
  use: [],
  attributes: {
    test: {
      type: Number,
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
  accessorValue: undefined,
  name: 'mixin1',
  use: [MixinTestTwo],
  attributes: {
    test: {
      type: String,
    },
  },
  initialState: {
    b: 0,
    accessorValue: 'world',
  },
  get accessorTest() {
    return this.accessorValue;
  },
  set accessorTest(value) {
    this.accessorValue = value;
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
  accessorValue: undefined,
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
  get accessorTest() {
    return 'hello ' + this.accessorValue;
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

describe('Mixin Compositor', () => {
  it('merge mixin', () => {
    const result = Compositor.mergeMixin(component);
    expect(result.length).eq(2);
    expect(result[0].name).eq('mixin1');
    expect(result[1].name).eq('mixin2');
  });

  it('merge attributes', () => {
    const result = Compositor.mergeAttributes([
      component,
      MixinTestOne,
      MixinTestTwo,
    ]);
    expect(Reflect.ownKeys(result).length).eq(2);
    expect(result.myAttribute.type).eq(String);
    expect(result.test.type).eq(String);
  });

  it('merge initial state', () => {
    const result = Compositor.mergeInitialState([
      component,
      MixinTestOne,
      MixinTestTwo,
    ]);
    expect(Reflect.ownKeys(result).length).eq(4);
    expect(result.a).eq(0);
    expect(result.b).eq(0);
    expect(result.c.test).eq(0);
    expect(result.accessorValue).eq('world');
  });

  it('merge hooks', () => {
    const result = Compositor.mergeHooks([
      component,
      MixinTestOne,
      MixinTestTwo,
    ]);
    const hookNames = Reflect.ownKeys(result);

    expect(hookNames.length).eq(3);
    for (const hookName of hookNames) {
      for (const hook of result[hookName]) {
        expect(typeof hook).eq('function');
      }
    }

    expect(result.created.length).eq(3);
    expect(result.attached.length).eq(2);
    expect(result.detached.length).eq(2);

    expect(result.created[0].toString()).eq(MixinTestTwo.created.toString());
    expect(result.created[1].toString()).eq(MixinTestOne.created.toString());
    expect(result.created[2].toString()).eq(component.created.toString());
  });

  it('merge accessors', () => {
    const result = Compositor.mergeAccessors([
      component,
      MixinTestOne,
      MixinTestTwo,
    ]);
    const accessors = Object.keys(result);

    expect(accessors.length).eq(1);
    for (const accessorName of accessors) {
      expect(typeof result[accessorName].get).eq('function');
      expect(typeof result[accessorName].set).eq('function');
    }

    expect(result.accessorTest.get.toString()).eq(
      Reflect.getOwnPropertyDescriptor(
        component,
        'accessorTest',
      )?.get?.toString(),
    );
    expect(result.accessorTest.set.toString()).eq(
      Reflect.getOwnPropertyDescriptor(
        MixinTestOne,
        'accessorTest',
      )?.set?.toString(),
    );
  });

  it('merge methods', () => {
    const result = Compositor.mergeMethods([
      component,
      MixinTestOne,
      MixinTestTwo,
    ]);
    const methodNames = Array.from(result.keys());

    expect(methodNames.length).eq(4);
    for (const methodName of methodNames) {
      expect(typeof result.get(methodName)).eq('function');
    }

    expect(result.get('methodA').toString()).eq(
      MixinTestOne.methodA.toString(),
    );
    expect(result.get('methodB').toString()).eq(
      MixinTestTwo.methodB.toString(),
    );
    expect(result.get('methodC').toString()).eq(component.methodC.toString());
    expect(result.get('methodD').toString()).eq(component.methodD.toString());
  });
});
