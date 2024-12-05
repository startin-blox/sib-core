import { ComponentFactory } from '../../../src/libs/ComponentFactory.ts';

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
    accessorValue: 'world',
  },
  get accessorTest() {
    return this.accessorValue;
  },
  set accessorTest(value) {
    this.accessorValue = value;
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
  name: 'comp',
  use: [MixinTestOne],
  attributes: {
    myAttribute: {
      type: String,
      default: 'awesome',
      callback: function () {
        this.change = true;
      },
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
  get accessorTest() {
    return `hello ${this.accessorValue}`;
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

describe('Component factory', () => {
  it('expose html element', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect(component.element).is.instanceOf(HTMLElement);
  });

  it('initialize state', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect((<any>component).a).eq(1);
    expect((<any>component).accessorValue).eq('world');
    expect((<any>component).c.test).eq(0);
  });

  it('bind attribute default', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect((<any>component).test).eq(0);
  });

  it('list attributes on static', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    expect((<any>ComponentConstructor).observedAttributes).deep.eq([
      'test',
      'my-attribute',
      'data',
      'works',
      'required',
    ]);
  });

  it('bind attribute', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect((<any>component).myAttribute).eq('awesome');
    (<any>component).myAttribute = 'a';
    expect((<any>component).myAttribute).eq('a');
    expect(component.element.getAttribute('my-attribute')).eq('a');
  });

  it('bind attribute with typecasting', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    (<any>component).test = '1';
    expect((<any>component).test).eq(1);
    const data = { hello: 'world!' };
    (<any>component).data = data;
    expect((<any>component).data).deep.eq(data);
    expect(component.element.getAttribute('data')).eq(JSON.stringify(data));
  });

  it('bind boolean attribute', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    (<any>component).works = true;
    expect(component.element.hasAttribute('works')).eq(true);
    (<any>component).works = false;
    expect(component.element.hasAttribute('works')).eq(false);
  });

  it('bind throw error if required attribute missing', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect(() => (<any>component).required).throw(
      'Attribute required is required',
    );
  });

  it('bind accessors', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect((<any>component).accessorTest).eq('hello world');
    (<any>component).accessorTest = 'you';
    expect((<any>component).accessorTest).eq('hello you');
    expect((<any>component).accessorValue).eq('you');
  });

  it('bind methods', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    expect((<any>component).methodA()).eq('A');
    expect((<any>component).methodB()).eq('B');
    expect((<any>component).methodC()).eq('C');
    (<any>component).methodD();
    expect((<any>component).change).eq(true);
  });

  it('bind hooks', () => {
    const ComponentConstructor = ComponentFactory.build(Component);
    const component = new ComponentConstructor(document.createElement('p'));
    component.created();
    expect((<any>component).message).eq('hello world !!');

    component.attached();
    expect((<any>component).message).eq('hooks respect order');

    component.detached();
    expect((<any>component).message).eq('and context');
  });
});
