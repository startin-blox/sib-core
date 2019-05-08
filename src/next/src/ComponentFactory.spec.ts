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
  name: 'comp',
  use: [MixinTestOne],
  attributes: {
    myAttribute: {
      type: String,
      default: 'awesome',
      callback: function() {
        (<any>this).change = true;
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
    (<any>this).change = true;
  },
};

describe('Component factory', function() {
  test('expose html element', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect(component.element).toBeInstanceOf(HTMLElement);
  });

  test('initialize state', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect((<any>component).a).toEqual(1);
    expect((<any>component).c.test).toEqual(0);
  });

  test('bind attribute default', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect((<any>component).test).toEqual(0);
  });

  test('list attributes on static', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    expect((<any>ComponentConstructor).observedAttributes).toEqual([
      'test',
      'my-attribute',
      'data',
      'works',
      'required',
    ]);
  });

  test('bind attribute', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect((<any>component).myAttribute).toEqual('awesome');
    (<any>component).myAttribute = 'a';
    expect((<any>component).myAttribute).toEqual('a');
    expect(component.element.getAttribute('my-attribute')).toEqual('a');
  });

  test('bind attribute with typecasting', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    (<any>component).test = '1';
    expect((<any>component).test).toEqual(1);
    const data = { hello: 'world!' };
    (<any>component).data = data;
    expect((<any>component).data).toEqual(data);
    expect(component.element.getAttribute('data')).toEqual(JSON.stringify(data));
  });

  test('bind boolean attribute', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    (<any>component).works = true;
    expect(component.element.hasAttribute('works')).toEqual(true);
    (<any>component).works = false;
    expect(component.element.hasAttribute('works')).toEqual(false);
  });

  test('bind throw error if required attribute missing', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect(() => (<any>component).required).toThrowError('Attribute required is required');
  });

  test('bind attribute with callback', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect((<any>component).change).toEqual(false);
    (<any>component).myAttribute = '1';
    expect((<any>component).change).toEqual(true);
  });

  test('bind methods', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect((<any>component).methodA()).toEqual('A');
    expect((<any>component).methodB()).toEqual('B');
    expect((<any>component).methodC()).toEqual('C');
    (<any>component).methodD();
    expect((<any>component).change).toEqual(true);
  });

  test('bind hooks', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    component.created();
    expect((<any>component).message).toEqual('hello world !!');

    component.attached();
    expect((<any>component).message).toEqual('hooks respect order');

    component.detached();
    expect((<any>component).message).toEqual('and context');
  });
});
