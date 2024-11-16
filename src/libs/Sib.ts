import { ComponentFactory } from './ComponentFactory.js';
import { defineComponent } from './helpers.js';
import type {
  ComponentConstructorInterface,
  ComponentInterface,
  MixinStaticInterface,
} from './interfaces.js';

export class Sib {
  public static register(componentDefinition: MixinStaticInterface): void {
    const component = ComponentFactory.build(componentDefinition);
    const cls = Sib.toElement(component);
    defineComponent(component.name, cls);
  }

  protected static toElement(
    component: ComponentConstructorInterface,
  ): typeof HTMLElement {
    return class extends HTMLElement {
      private _component: ComponentInterface | null = null;

      constructor() {
        super();
        this.component = new component(this);
        this.component.created();
      }

      get component(): ComponentInterface {
        if (this._component === null) {
          throw new Error('No component found');
        }
        return this._component;
      }
      set component(component: ComponentInterface) {
        this._component = component;
      }

      static get observedAttributes() {
        return (<any>component).observedAttributes;
      }

      attributeChangedCallback(name, oldValue, newValue) {
        const attr = name.replace(
          /([a-z0-9])-([a-z0-9])/g,
          (_c, p1, p2) => `${p1}${p2.toUpperCase()}`,
        );
        this.component.attributesCallback(attr, newValue, oldValue);
      }

      connectedCallback() {
        this.component.attached();
      }

      disconnectedCallback() {
        this.component.detached();
      }
    };
  }
}
