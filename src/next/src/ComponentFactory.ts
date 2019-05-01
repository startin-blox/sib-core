import { Compositor } from './mixin/Compositor';
import { Component } from './parents/Component';
import { MixinStaticInterface } from './mixin/interfaces/MixinStaticInterface';
import { AttributesDefinitionInterface } from './mixin/interfaces/AttributesDefinitionInterface';
import { ComponentConstructorInterface } from './mixin/interfaces/ComponentConstructorInterface';
import { ArrayOfHooksInterface } from './mixin/interfaces/ArrayOfHooksInterface';
import { ComponentInterface } from './mixin/interfaces/ComponentInterface';

export class ComponentFactory {
  public static build(component: MixinStaticInterface): ComponentConstructorInterface {
    const { initialState, attributes, methods, hooks, name } = Compositor.merge(component, Compositor.mergeMixin(component));

    let componentConstructor = class extends Component {};

    componentConstructor = ComponentFactory.bindInitialState(componentConstructor, initialState);
    componentConstructor = ComponentFactory.bindAttributes(componentConstructor, attributes);
    componentConstructor = ComponentFactory.bindMethods(componentConstructor, methods);
    componentConstructor = ComponentFactory.bindHooks(componentConstructor, hooks);

    Reflect.defineProperty(componentConstructor, 'name', {
      value: name,
    });

    return componentConstructor;
  }

  protected static bindInitialState(componentConstructor: ComponentConstructorInterface, initialState: object | undefined):any {
    if (initialState) {
      Reflect.ownKeys(initialState).forEach(key => {
        Reflect.defineProperty(componentConstructor.prototype, key, {
          enumerable: true,
          writable: true,
          value: initialState[key],
        });
      });
    }

    return componentConstructor;
  }

  protected static bindAttributes(componentConstructor: ComponentConstructorInterface, attributes: AttributesDefinitionInterface | undefined): ComponentConstructorInterface {
    if (attributes) {
      const attributesList = Reflect.ownKeys(attributes).map(key => String(key));
      const attributesCallback = {};

      attributesList.forEach(key => {
        const { default: def, type, required, callback } = attributes[key];

        let fromType;
        let toType;

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

        const attribute = key.replace(/([a-z0-9])([A-Z0-9])/g, '$1_$2').toLowerCase();

        Reflect.defineProperty(componentConstructor.prototype, key, {
          enumerable: true,
          configurable: false,
          get: function () {
            const element = (<ComponentInterface>this).element;
            if (!element.hasAttribute(attribute)) {
              if (required && type !== Boolean) {
                throw new Error(`Attribute ${key} is required`);
              }
              return def;
            }
            return fromType(element.getAttribute(attribute));
          },
          set: function (value) {
            const oldValue = this[key];
            const element = (<ComponentInterface>this).element;
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
          attributesCallback[key] = Reflect.apply(callback, this, [value, oldValue]);
        }
      });

      Reflect.defineProperty(componentConstructor, 'observedAttributes', {
        get: () => attributesList.map(attr => attr.replace(/([a-z0-9])([A-Z0-9])/g, '$1_$2').toLowerCase()),
      });

      Reflect.defineProperty(componentConstructor.prototype, 'attributesCallback', attributesCallback);
    }
    return componentConstructor;
  }

  protected static bindMethods(componentConstructor: ComponentConstructorInterface, methods: Map<string, Function>): ComponentConstructorInterface {
    methods.forEach((method, methodName: string) => {
      Reflect.defineProperty(componentConstructor.prototype, methodName, {
        value: function(...args) {
          return Reflect.apply(method, this, args);
        }
      });
    });
    return componentConstructor;
  }

  protected static bindHooks(componentConstructor: ComponentConstructorInterface, hooks: ArrayOfHooksInterface): ComponentConstructorInterface {
    Reflect.defineProperty(componentConstructor.prototype, 'created', {
      value: function() {
        hooks.created.forEach(hook => {
          Reflect.apply(hook, this, []);
        });
      },
    });

    Reflect.defineProperty(componentConstructor.prototype, 'attached', {
      value: function() {
        hooks.attached.forEach(hook => {
          Reflect.apply(hook, this, []);
        });
      },
    });

    Reflect.defineProperty(componentConstructor.prototype, 'detached', {
      value: function() {
        hooks.detached.forEach(hook => {
          Reflect.apply(hook, this, []);
        });
      },
    });
    return componentConstructor;
  }
}
