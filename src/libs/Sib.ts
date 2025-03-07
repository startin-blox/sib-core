import { ComponentFactory } from './ComponentFactory.js';
import { defineComponent } from './helpers.js';
import type {
  ComponentConstructorInterface,
  ComponentInterface,
  MixinStaticInterface,
} from './interfaces.js';

export const Sib = {
  register(componentDefinition: MixinStaticInterface): void {
    const component = ComponentFactory.build(componentDefinition);
    const cls = Sib.toElement(component);
    defineComponent(component.name, cls);
  },
  toElement(component: ComponentConstructorInterface): typeof HTMLElement {
    return class extends HTMLElement {
      component: ComponentInterface;

      constructor() {
        super();
        this.component = new component(this);
        this.component.created();
      }

      /** @deprecated use `component` instead */
      get _component(): ComponentInterface {
        return this.component;
      }
      set _component(_component: ComponentInterface) {
        this.component = _component;
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
  },
};
