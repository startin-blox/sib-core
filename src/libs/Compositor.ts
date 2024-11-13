import type {
  AccessorStaticInterface,
  ArrayOfHooksInterface,
  AttributesDefinitionInterface,
  ComponentStaticInterface,
  MixinStaticInterface,
} from './interfaces.ts';

const HOOKS = ['created', 'attached', 'detached'];
const API = ['name', 'use', 'attributes', 'initialState', ...HOOKS];

export const Compositor = {
  merge(
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
  },
  mergeMixin(component: MixinStaticInterface): MixinStaticInterface[] {
    function deepMergeMixin(
      mixinAccumulator: Map<MixinStaticInterface, MixinStaticInterface>,
      currentMixin: MixinStaticInterface,
    ) {
      const { use: currentMixins } = currentMixin;
      if (currentMixins) {
        for (const mix of currentMixins) {
          if (!mixinAccumulator.has(mix)) {
            mixinAccumulator.set(mix, mix);
            deepMergeMixin(mixinAccumulator, mix);
          } else {
            console.warn(`Duplicate mixin import (${mix.name})`);
          }
        }
      }
    }

    const mixins = new Map();
    deepMergeMixin(mixins, component);

    return Array.from(mixins.values());
  },
  mergeAttributes(
    mixins: MixinStaticInterface[],
  ): AttributesDefinitionInterface {
    let attributes = {};

    for (const mixin of mixins) {
      if (mixin.attributes) {
        attributes = { ...mixin.attributes, ...attributes };
      }
    }

    return attributes;
  },
  mergeInitialState(mixins: MixinStaticInterface[]) {
    let initialState: any = {};

    for (const mixin of mixins) {
      if (!mixin.initialState) continue;
      initialState = { ...mixin.initialState, ...initialState };
    }

    return initialState;
  },
  mergeHooks(mixins: MixinStaticInterface[]): ArrayOfHooksInterface {
    const hooks = {
      created: [],
      attached: [],
      detached: [],
    };
    for (const mixin of mixins.reverse()) {
      for (const hookName of HOOKS) {
        if (!!mixin[hookName] && typeof mixin[hookName] === 'function') {
          hooks[hookName].push(mixin[hookName]);
        }
      }
    }

    return hooks;
  },
  mergeMethods(mixins: MixinStaticInterface[]): Map<any, any> {
    const methods = new Map();

    for (const mixin of mixins.reverse()) {
      for (const key of Reflect.ownKeys(mixin)) {
        if (typeof key !== 'string') continue;
        if (API.includes(key)) continue;
        const descriptor = Object.getOwnPropertyDescriptor(mixin, key);
        if (descriptor?.get || descriptor?.set) continue;
        if (typeof mixin[key] !== 'function') continue;
        methods.set(key, mixin[key]);
      }
    }
    return methods;
  },
  mergeAccessors(mixins: MixinStaticInterface[]): AccessorStaticInterface {
    const accessors = {};
    for (const mixin of mixins.reverse()) {
      for (const prop of Reflect.ownKeys(mixin)) {
        if (typeof prop !== 'string') continue;
        if (API.includes(prop)) continue;
        const descriptor = Object.getOwnPropertyDescriptor(mixin, prop);
        if (!descriptor) continue;
        if (!descriptor.get && !descriptor.set) continue;
        accessors[prop] = { ...accessors[prop] };
        if (descriptor.get) accessors[prop].get = descriptor.get;
        if (descriptor.set) accessors[prop].set = descriptor.set;
      }
    }
    return accessors;
  },
};
