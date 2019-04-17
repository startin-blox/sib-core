import { expect } from 'chai';
import { ComponentFactory } from './ComponentFactory';

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
    console.log('created2');
  },
  attached() {
    console.log('attached2');
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
    console.log('created1');
  },
  detached() {
    console.log('detached2');
  },
  methodA() {
    return 'A';
  },
  methodC() {
    console.log('methodCMixin1');
  },
};

const Component = {
  name: 'comp',
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
    }
  },
  initialState: {
    c: {
      test: 0,
    },
    change: false,
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
    return 'C';
  },
  methodD() {
    (this as any).change = true;
  },
};

describe('Component factory', function() {
  it('expose html element', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'), ComponentConstructor.observedAttributes, ComponentConstructor.requiredObservedAttributes);
    expect(component.element).a.instanceOf(HTMLElement);
  });

  it('initialize state', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'), ComponentConstructor.observedAttributes, ComponentConstructor.requiredObservedAttributes);
    expect(component.a).equal(1);
    expect(component.c.test).equal(0);
  });

  it('bind attribute default', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'), ComponentConstructor.observedAttributes, ComponentConstructor.requiredObservedAttributes);
    expect(component.test).equal(0);
  });

  it('bind attribute', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'), ComponentConstructor.observedAttributes, ComponentConstructor.requiredObservedAttributes);
    expect(component.myAttribute).equal('awesome');
    component.myAttribute = 'a';
    expect(component.myAttribute).equal('a');
  });

  it('bind attribute with typecasting', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'), ComponentConstructor.observedAttributes, ComponentConstructor.requiredObservedAttributes);
    component.test = '1';
    expect(component.test).equal(1);
    component.data = "{ \"hello\": \"world!\" }";
    expect(component.data.hello).equal('world!');
  });

  it('bind attribute with callback', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'), ComponentConstructor.observedAttributes, ComponentConstructor.requiredObservedAttributes);
    expect(component.change).equal(false);
    component.myAttribute = '1';
    expect(component.change).equal(true);
  });

  it('bind methods', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'), ComponentConstructor.observedAttributes, ComponentConstructor.requiredObservedAttributes);
    expect(component.methodA()).equal('A');
    expect(component.methodB()).equal('B');
    expect(component.methodC()).equal('C');
    component.methodD();
    expect(component.change).equal(true);
  });
  
});
