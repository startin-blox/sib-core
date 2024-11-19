import type {
  AccessorStaticInterface,
  ArrayOfHooksInterface,
  AttributesDefinitionInterface,
  ComponentStaticInterface,
  MixinStaticInterface,
} from './interfaces';

const HOOKS = ['created', 'attached', 'detached'];
const API = ['name', 'use', 'attributes', 'initialState', ...HOOKS];

export class Compositor {
  public static merge(
    component: MixinStaticInterface,
    mixins: MixinStaticInterface[],
  ): ComponentStaticInterface {
    return {
      name: component.name,
      attributes: Compositor.mergeAttributes([component, ...mixins]),
      initialState: Compositor.mergeInitialState([component, ...mixins]),
      methods: Compositor.mergeMethods([component, ...mixins]),
      accessors: Compositor.mergeAccessors([component, ...mixins]),
      hooks: Compositor.mergeHooks([component, ...mixins]),
    };
  }

  public static mergeMixin(
    component: MixinStaticInterface,
  ): MixinStaticInterface[] {
    function deepMergeMixin(
      mixinAccumulator: Map<MixinStaticInterface, MixinStaticInterface>,
      currentMixin: MixinStaticInterface,
    ) {
      const { use: currentMixins } = currentMixin;
      if (currentMixins) {
        currentMixins.forEach(mix => {
          if (!mixinAccumulator.has(mix)) {
            mixinAccumulator.set(mix, mix);
            deepMergeMixin(mixinAccumulator, mix);
          } else {
            console.warn(`Duplicate mixin import (${mix.name})`);
          }
        });
      }
    }

    const mixins = new Map();
    deepMergeMixin(mixins, component);

    return Array.from(mixins.values());
  }

  public static mergeAttributes(
    mixins: MixinStaticInterface[],
  ): AttributesDefinitionInterface {
    let attributes = {};

    mixins.forEach(mixin => {
      if (mixin.attributes) {
        attributes = { ...mixin.attributes, ...attributes };
      }
    });

    return attributes;
  }

  public static mergeInitialState(mixins: MixinStaticInterface[]): any {
    let initialState = {};

    mixins.forEach(mixin => {
      if (mixin.initialState) {
        initialState = { ...mixin.initialState, ...initialState };
      }
    });

    return initialState;
  }

  public static mergeHooks(
    mixins: MixinStaticInterface[],
  ): ArrayOfHooksInterface {
    const hooks = {
      created: [],
      attached: [],
      detached: [],
    };
    mixins.reverse().forEach(mixin => {
      HOOKS.forEach(hookName => {
        if (!!mixin[hookName] && typeof mixin[hookName] === 'function') {
          hooks[hookName].push(mixin[hookName]);
        }
      });
    });

    return hooks;
  }

  public static mergeMethods(mixins: MixinStaticInterface[]): Map<any, any> {
    const methods = new Map();

    mixins.reverse().forEach(mixin => {
      const keys = Reflect.ownKeys(mixin).filter(
        key =>
          typeof key === 'string' &&
          API.indexOf(key) < 0 &&
          !Object.getOwnPropertyDescriptor(mixin, key)!.get &&
          !Object.getOwnPropertyDescriptor(mixin, key)!.set &&
          typeof mixin[key] === 'function',
      );

      keys.forEach(key => {
        methods.set(key, mixin[key]);
      });
    });
    return methods;
  }

  public static mergeAccessors(
    mixins: MixinStaticInterface[],
  ): AccessorStaticInterface {
    const accessors = {};
    mixins.reverse().forEach(mixin => {
      Reflect.ownKeys(mixin)
        .filter(
          key =>
            typeof key === 'string' &&
            API.indexOf(key) < 0 &&
            (Object.getOwnPropertyDescriptor(mixin, key)!.get ||
              Object.getOwnPropertyDescriptor(mixin, key)!.set),
        )
        .forEach(prop => {
          accessors[prop] = { ...accessors[prop] };
          if (Reflect.getOwnPropertyDescriptor(mixin, prop)!.get)
            accessors[prop].get = Reflect.getOwnPropertyDescriptor(
              mixin,
              prop,
            )!.get;
          if (Reflect.getOwnPropertyDescriptor(mixin, prop)!.set)
            accessors[prop].set = Reflect.getOwnPropertyDescriptor(
              mixin,
              prop,
            )!.set;
        });
    });
    return accessors;
  }
}
