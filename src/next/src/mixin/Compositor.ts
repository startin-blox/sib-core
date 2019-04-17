import { MixinStaticInterface } from './interfaces/MixinStaticInterface';
import { ComponentStaticInterface } from './interfaces/ComponentStaticInterface';

import { AttributesDefinitionInterface } from './interfaces/AttributesDefinitionInterface';
import { ArrayOfHooksInterface } from './interfaces/ArrayOfHooksInterface';

const HOOKS = ['created', 'attached', 'detached'];
const API = [
  'name',
  'use',
  'attributes',
  'initialState',
  ...HOOKS,
];

export class Compositor {
  public static merge(component: MixinStaticInterface, mixins: MixinStaticInterface[]): ComponentStaticInterface {
    return {
      name: component.name,
      attributes: Compositor.mergeAttributes([ component, ...mixins ]),
      initialState: Compositor.mergeInitialState([ component, ...mixins ]),
      methods: Compositor.mergeMethods([ component, ...mixins]),
      hooks: Compositor.mergeHooks([ component, ...mixins ]),
    };
  }

  public static mergeMixin(component: MixinStaticInterface): MixinStaticInterface[] {
    function deepMergeMixin(mixinAccumulator: Map<MixinStaticInterface, MixinStaticInterface>, currentMixin: MixinStaticInterface) {
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

  public static mergeAttributes(mixins: MixinStaticInterface[]): AttributesDefinitionInterface {
    let attributes = {};

    mixins.forEach(mixin => {
      if (!!mixin.attributes) {
        attributes = {...mixin.attributes, ...attributes };
      }
    });

    return attributes;
  }

  public static mergeInitialState(mixins: MixinStaticInterface[]): any {
    let initialState = {};

    mixins.forEach(mixin => {
      if (!!mixin.initialState) {
        initialState = {...mixin.initialState, ...initialState };
      }
    });

    return initialState;
  }

  public static mergeHooks(mixins: MixinStaticInterface[]): ArrayOfHooksInterface {
    const hooks = {
      created: [],
      attached: [],
      detached: [],
    };

    HOOKS.forEach(hookName => {
      mixins
        .reverse()
        .forEach(mixin => {
            if(!!mixin[hookName] && typeof mixin[hookName] === 'function') {
              hooks[hookName].push(mixin[hookName]);
            }
        });
    });

    return hooks;
  }

  // TODO add map typing
  public static mergeMethods(mixins: MixinStaticInterface[]): Map<any, any> {
    const methods = new Map();

    mixins.reverse().forEach(mixin => {
      const keys = Reflect
        .ownKeys(mixin)
        .filter(key => (typeof key === 'string' && API.indexOf(key) < 0 && typeof mixin[key] === 'function'));

      keys.forEach(key => {
        methods.set(key, mixin[key]);
      });
    });

    return methods;
  }
}