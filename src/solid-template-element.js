export default class SolidTemplateElement extends HTMLElement {
  constructor() {
    super();
    this.initProps();
  }

  static get observedAttributes() {
    return Object.values(this.propsDefinition);
  }

  static get propsDefinition() {
    return {
    };
  }

  initProps() {
    this.props = {}
    for(let key in this.constructor.propsDefinition) {
      this.props[key] = undefined;
    }
  }

  updateProps() {
    const declaredAttributes = [];

    // Get props values
    for(let key in this.constructor.propsDefinition) {
      const def = this.constructor.propsDefinition[key];
      if (typeof def === "string") {
        this.props[key] = this.hasAttribute(def) ? this.getAttribute(def) : undefined;
        declaredAttributes.push(def);
      } else if (typeof def === "object" && def.attribute && typeof def.attribute === "string") {
        this.props[key] = this.hasAttribute(def.attribute) ? this.getAttribute(def.attribute) : def.default || undefined;
        declaredAttributes.push(def.attribute);
      }
    }

    // Add attributes to props
    for (let attr of this.attributes) {
      if (!declaredAttributes.includes(attr.name)) { // if attribute not in propsDefinition
        this.props[this._camelize(attr.name)] = attr.value || undefined; // add it to props
      }
    }
  }

  attributeChangedCallback()
  {
    this.updateProps();
    this.render();
  }

  connectedCallback() {
    this.updateProps();
    this.render();
  }

  render() {
    this.innerHTML = this.template(this.props);
  }

  template() {
    return '';
  }

  _camelize(str) {
    return str.replace(/\W+(.)/g, (match, chr) => chr.toUpperCase());
  }
}
