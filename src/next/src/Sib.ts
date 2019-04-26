import { ComponentConstructorInterface } from "./mixin/interfaces/ComponentConstructorInterface";
import { ComponentInterface } from "./mixin/interfaces/ComponentInterface";
import { MixinStaticInterface } from "./mixin/interfaces/MixinStaticInterface";
import { ComponentFactory } from "./ComponentFactory";

export class Sib {
    public static register(componentDefinition: MixinStaticInterface):void {
        const component = ComponentFactory.build(componentDefinition);
        window.customElements.define(component.name, this.toElement(component));
    }

    protected static toElement(component: ComponentConstructorInterface): Function {
        return class extends HTMLElement {
            private _component: ComponentInterface | null = null;

            constructor() {
                super();
                this.component = new component(this);
                this.component.created();
            }

            get component(): ComponentInterface {
                if (this._component === null) {
                    throw new Error('No componenent found');
                }
                return this._component;
            }
            set component(component: ComponentInterface) {
                this._component = component;
            }
    
            static get observedAttributes() {
                return (<any>component).observedAttributes;
            }
            
            attributeChangedCallback(name, _oldValue, newValue) {
                const attr = name.replace(/([a-z0-9])_([a-z0-9])/g, (_c, p1, p2) => `${p1}${p2.toUpperCase()}`);
                this.component[attr] = newValue;
            }
    
            connectedCallback() {
                this.component.attached();
            }
    
            disconnectedCallback() {
                this.component.detached();
            }
        }
    }
}