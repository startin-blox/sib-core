export default class Renderer {
  constructor(component, el, template) {
    this.component = component;
    this.el = el;
    this.template = template;

    this.boot();
  }

  boot() {
    this.component.addEventListener('created', () => {
      /* Sib if binding */
      this.template.querySelectorAll('[sib-if]').forEach((node) => {
        const propName = node.getAttribute('sib-if');
        this.component.addEventListener(`dataChanged:${propName}`, (event) => {
          const { detail } = event;
          if (!detail.value) {
            this.dispatchStyleToNode({ node, attribute: 'display', value: 'none'});
          } else {
            this.dispatchStyleToNode({ node, attribute: 'display', value: undefined});
          }
        });
      });

      /* Sib value bindings */
      this.template.querySelectorAll('[sib-value]').forEach((node) => {
        const propName = node.getAttribute('sib-value');
        this.component.addEventListener(`dataChanged:${propName}`, (event) => {
          const { detail } = event;
          this.dispatchDataToNode({ node, value: detail.value });
        });
      });

      /* Sib attribute bindings */
      const sibAttributeWildCard = 'sib-attribute:';
      this.template.querySelectorAll('[sib-attribute]').forEach((node) => {
        const attributes = Reflect.ownKeys(node.attributes)
          .filter((attr) => attr.startsWith(sibAttributeWildCard))
          .reduce((object, attr) => {
            object[attr.substring(sibAttributeWildCard.length)] = node.getAttribute(attr);
            return object;
          }, {});

        Reflect.ownKeys(attributes).forEach((attr) => {
          const propName = attributes[attr];
          const attributeTarget = attr;
          this.component.addEventListener(`dataChanged:${propName}`, (event) => {
              const { detail } = event;
              this.dispatchDataToNode({ node, attribute: attributeTarget, value: detail.value });
            });
        });
      });
    });

    this.component.addEventListener('attached', () => {
      this.render();
    });

    this.component.addEventListener('stateChanged', (event) => {
      this.dispatchData(event.detail || {});
    });
  }

  dispatchStyleToNode({ node, attribute, value }) {
    if (value) {
      node.style[attribute] = value;
    } else {
      node.style[attribute] = null;
    }
    this.component.dispatchEvent(new CustomEvent('updated'));
  }

  dispatchDataToNode({ node, attribute, value }) {
    if (attribute) {
      if (value) {
        node.setAttribute(attribute, value);
      } else {
        node.removeAttribute(attribute);
      }
    } else {
      node.textContent = value
    }

    this.component.dispatchEvent(new CustomEvent('updated'));
  }

  dispatchData({ selector, attribute, value }) {
    this.el.querySelectorAll(selector).forEach((node) => {
      this.dispatchDataToNode({ node, attribute, value});
    });
  }

  render() {
    this.el.innerHTML = '';
    this.el.appendChild(this.template);
    this.component.dispatchEvent(new CustomEvent('rendered'));
  }
}
