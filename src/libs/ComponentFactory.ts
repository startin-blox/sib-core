import { Component } from './Component.ts';
import { Compositor } from './Compositor.ts';
import type {
  AccessorStaticInterface,
  ArrayOfHooksInterface,
  AttributesDefinitionInterface,
  ComponentConstructorInterface,
  MixinStaticInterface,
} from './interfaces.ts';

export const ComponentFactory = {
  build(component: MixinStaticInterface): ComponentConstructorInterface {
    const { initialState, attributes, methods, hooks, accessors, name } =
      Compositor.merge(component, Compositor.mergeMixin(component));

    let componentConstructor = class extends Component {};

    componentConstructor = ComponentFactory.bindInitialState(
      componentConstructor,
      initialState,
    );
    componentConstructor = ComponentFactory.bindAttributes(
      componentConstructor,
      attributes,
    );
    componentConstructor = ComponentFactory.bindMethods(
      componentConstructor,
      methods,
    );
    componentConstructor = ComponentFactory.bindAccessors(
      componentConstructor,
      accessors,
    );
    componentConstructor = ComponentFactory.bindHooks(
      componentConstructor,
      hooks,
    );

    Reflect.defineProperty(componentConstructor, 'name', {
      value: name,
    });

    return componentConstructor;
  },
  bindInitialState(
    componentConstructor: ComponentConstructorInterface,
    initialState?: object,
  ): ComponentConstructorInterface {
    if (initialState) {
      for (const key of Reflect.ownKeys(initialState)) {
        Reflect.defineProperty(componentConstructor.prototype, key, {
          enumerable: true,
          writable: true,
          value: initialState[key],
        });
      }
    }

    return componentConstructor;
  },
  bindAttributes(
    componentConstructor: ComponentConstructorInterface,
    attributes?: AttributesDefinitionInterface,
  ): ComponentConstructorInterface {
    if (attributes) {
      const attributesList = Reflect.ownKeys(attributes).map(key =>
        String(key),
      );
      const attributesCallback = {};

      for (const key of attributesList) {
        const { default: def, type, required, callback } = attributes[key];

        let fromType: (value: string) => unknown;
        let toType: (value: unknown) => unknown;

        switch (type) {
          case String:
            fromType = value => String(value);
            toType = value => value;
            break;
          case Object:
            fromType = value => JSON.parse(value);
            toType = value => JSON.stringify(value);
            break;
          case Number:
            fromType = value => Number(value);
            toType = value => Number(value).toString();
            break;
          case Boolean:
            fromType = value => Boolean(value);
            toType = value => value;
            break;
          default:
            fromType = value => value;
            toType = value => value;
            break;
        }

        const attribute = key
          .replace(/([a-z0-9])([A-Z0-9])/g, '$1-$2')
          .toLowerCase();

        Reflect.defineProperty(componentConstructor.prototype, key, {
          enumerable: true,
          configurable: false,
          get: function () {
            const element = this.element;
            if (!element.hasAttribute(attribute)) {
              if (required && type !== Boolean) {
                throw new Error(`Attribute ${key} is required`);
              }
              return def;
            }
            return fromType(element.getAttribute(attribute));
          },
          set: function (value) {
            const element = this.element;
            if (type === Boolean) {
              if (!value) {
                element.removeAttribute(attribute);
              } else {
                element.setAttribute(attribute, '');
              }
            } else {
              element.setAttribute(attribute, toType(value));
            }
          },
        });

        if (callback && typeof callback === 'function') {
          attributesCallback[key] = callback;
        }
      }

      Reflect.defineProperty(componentConstructor, 'observedAttributes', {
        get: () =>
          attributesList.map(attr =>
            attr.replace(/([a-z0-9])([A-Z0-9])/g, '$1-$2').toLowerCase(),
          ),
      });

      Reflect.defineProperty(
        componentConstructor.prototype,
        'attributesCallback',
        {
          value: function (key, newValue, oldValue) {
            if (key in attributesCallback) {
              Reflect.apply(attributesCallback[key], this, [
                newValue,
                oldValue,
              ]);
            }
          },
        },
      );

      Reflect.defineProperty(
        componentConstructor.prototype,
        'attributesCallback',
        attributesCallback,
      );
    }
    return componentConstructor;
  },
  bindAccessors(
    componentConstructor: ComponentConstructorInterface,
    accessors?: AccessorStaticInterface,
  ): ComponentConstructorInterface {
    if (accessors) {
      for (const property of Object.keys(accessors)) {
        Reflect.defineProperty(componentConstructor.prototype, property, {
          get: function () {
            return Reflect.apply(accessors[property].get, this, []);
          },
          set: function (value) {
            return Reflect.apply(accessors[property].set, this, [value]);
          },
        });
      }
    }
    return componentConstructor;
  },
  bindMethods(
    componentConstructor: ComponentConstructorInterface,
    methods: Map<string, Function>,
  ): ComponentConstructorInterface {
    methods.forEach((method, methodName) => {
      Reflect.defineProperty(componentConstructor.prototype, methodName, {
        value: function (...args) {
          return Reflect.apply(method, this, args);
        },
      });
    });
    return componentConstructor;
  },
  bindHooks(
    componentConstructor: ComponentConstructorInterface,
    hooks: ArrayOfHooksInterface,
  ): ComponentConstructorInterface {
    Reflect.defineProperty(componentConstructor.prototype, 'created', {
      value: function () {
        for (const hook of hooks.created) {
          Reflect.apply(hook, this, []);
        }
      },
    });

    Reflect.defineProperty(componentConstructor.prototype, 'attached', {
      value: function () {
        for (const hook of hooks.attached) {
          Reflect.apply(hook, this, []);
        }
      },
    });

    Reflect.defineProperty(componentConstructor.prototype, 'detached', {
      value: function () {
        for (const hook of hooks.detached) {
          Reflect.apply(hook, this, []);
        }
      },
    });
    return componentConstructor;
  },
};
