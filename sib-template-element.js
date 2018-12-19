class SIBTemplateElement extends HTMLElement {
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
    for(let key in this.constructor.propsDefinition) {
      const def = this.constructor.propsDefinition[key];
      if (typeof def === "string") {
        this.props[key] = this.hasAttribute(def) ? this.getAttribute(def) : undefined;
      } else if (typeof def === "object" && def.attribute && typeof def.attribute === "string") {
        this.props[key] = this.hasAttribute(def) ? this.getAttribute(def.attribute) : def.default || undefined;
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
}