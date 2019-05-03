import { ComponentConstructorInterface } from "./mixin/interfaces/ComponentConstructorInterface.js";
import { ComponentInterface } from "./mixin/interfaces/ComponentInterface.js";
import { MixinStaticInterface } from "./mixin/interfaces/MixinStaticInterface.js";
import { ComponentFactory } from "./ComponentFactory.js";

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

            get attributesCallback() {
                return (<any>component).attributesCallback
            }

            attributeChangedCallback(name, oldValue, newValue) {
                const attr = name.replace(/([a-z0-9])-([a-z0-9])/g, (_c, p1, p2) => `${p1}${p2.toUpperCase()}`);

                if (this.attributesCallback && attr in this.attributesCallback) {
                    this.attributesCallback[attr](newValue, oldValue);
                }
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
