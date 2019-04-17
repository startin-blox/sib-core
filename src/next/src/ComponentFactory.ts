import { Compositor } from './mixin/Compositor';
import { Component } from './parents/Component';
import { MixinStaticInterface } from './mixin/interfaces/MixinStaticInterface';
import { AttributesDefinitionInterface } from './mixin/interfaces/AttributesDefinitionInterface';

export class ComponentFactory {
  public static build(component: MixinStaticInterface): any {
    // const { name, initialState, , hooks } = Compositor.merge(component, Compositor.mergeMixin(component));
    const { initialState, attributes, methods } = Compositor.merge(component, Compositor.mergeMixin(component));

    let componentConstructor = class extends Component {};

    componentConstructor = ComponentFactory.bindInitialState(componentConstructor, initialState);
    componentConstructor = ComponentFactory.bindAttributes(componentConstructor, attributes);
    componentConstructor = ComponentFactory.bindMethods(componentConstructor, methods);

    return componentConstructor;
  }

  public static bindInitialState(componentConstructor: any, initialState: object | undefined) {
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

  public static bindAttributes(componentConstructor: any, attributes: AttributesDefinitionInterface | undefined) {
    if (attributes) {
      const attributesList = Reflect.ownKeys(attributes).map(key => String(key));
      const requiredAttributesList: String[] = [];

      attributesList.forEach(key => {
        const { default: def, type, required, callback } = attributes[key];

        Reflect.defineProperty(componentConstructor.prototype, `_${key}`, {
          enumerable: true,
          writable: true,
          value: def,
        });

        let fromType;
        // let toType;

        switch (type) {
          case String:
            fromType = value => String(value);
            break;
          case Object:
            fromType = value => JSON.parse(value);
            break;
          case Number:
            fromType = value => Number(value);
            break;
          case Boolean:
            fromType = value => Boolean(value);
            break;
          default:
            fromType = value => value;
            break;
        }

        const definition = {
          enumerable: true,
          configurable: false,
          get: function () { return this[`_${key}`];},
          set: function (value) {
            this[`_${key}`] = fromType(value);
          },
        };


        if (callback && typeof callback === 'function') {
          definition.set = function (value) {
            const oldValue = this[`_${key}`];
            this[`_${key}`] = fromType(value);
            callback.call(this, value, oldValue);
          }
        }

        Reflect.defineProperty(componentConstructor.prototype, key, definition);

        if (required) {
          requiredAttributesList.push(key);
        }
      });

      Reflect.defineProperty(componentConstructor, 'observedAttributes', {
        get: () => attributesList.map(attr => attr.replace(/([a-z0-9])([A-Z0-9])/g, '$1_$2').toLowerCase()),
      });

      Reflect.defineProperty(componentConstructor, 'observedRequiredAttributes', {
        get: () => requiredAttributesList,
      });
    }

    return componentConstructor;
  }

  public static bindMethods(componentConstructor: any, methods: Map<string, Function>) {
    methods.forEach((method, methodName: string) => {
      Reflect.defineProperty(componentConstructor.prototype, methodName, {
        value: function(...args) {
          return method.call(this, ...args);
        }
      });
    });
    return componentConstructor;
  }

  public static bindHooks() {}
}
