/* Events triggered to Component
 * "attached" when connected to DOM
 * "detached" whe disconnected from DOM
 * "attributeChanged" when an attribute mutate
 */
export default function ElementFactory(Component) {
  return class extends HTMLElement {
    constructor() {
      super();
      this.component = new Component(this);
    }

    static get observedAttributes() {
      return Component.getAttributes();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      this.component.dispatchEvent(new CustomEvent('attributeChanged', {
        detail: { name, oldValue, newValue },
        passive: true,
      }));
    }

    connectedCallback() {
      this.component.dispatchEvent(new CustomEvent('attached'));
    }

    disconnectedCallback() {
      this.component.dispatchEvent(new CustomEvent('detached'));
    }

    addDOMEventListener(selector, event, callback) {
      this.querySelectorAll(selector).forEach((node) => {
        node.addEventListener(event, callback);
      });
    }
  }
}
