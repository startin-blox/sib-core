export default class SolidTemplateElement extends HTMLElement {
  constructor() {
    super();
    this.renderPlanned = false;
    this.strings = {};
    this.translationsPath = null;
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

  /**
   * Define the path folder of translations files
   * @param path
   */
  setTranslationsPath(path) {
    this.translationsPath = path;
  }

  /**
   * Fetch a translation file and render component
   */
  async fetchLocaleStrings() {
    if (!this.translationsPath) return;
    const ln = this.getLocale();
    return fetch(`${this.translationsPath}/${ln}.json`)
      .then((result) => {
        if (result.ok) {
          return result.json() // parse content
            .then(strings => this.strings = strings) // and store strings in variable
            .catch(e => console.error('Error while parsing the translation file.'));
        }
        else console.error('Error while retrieving the translation file.');
      });
  }

  /**
   * Returns current locale of app
   */
  getLocale() {
    return localStorage.getItem('language') || window.navigator.language.slice(0, 2);
  }

  /**
   * Return localized string for [key]
   * @param key
   */
  localize(key) {
    return this.strings[key] || key;
  }

  attributeChangedCallback()
  {
    this.updateProps();
    this.planRender();
  }

  connectedCallback() {
    this.updateProps();
    this.planRender();
  }

  /**
   * Plan a render if none is already waiting to prevent multi re-renders
   */
  planRender() {
    if (!this.renderPlanned) {
      this.renderPlanned = true;
      setTimeout(() => {
        this.render();
        this.renderPlanned = false;
      });
    }
  }

  render() {
    this.fetchLocaleStrings().finally(() => { // render even if some errors occured
      this.innerHTML = this.template(this.props);
    });
  }

  template() {
    return '';
  }

  _camelize(str) {
    return str.replace(/\W+(.)/g, (match, chr) => chr.toUpperCase());
  }
}
