///@ts-nocheck

export default class SolidTemplateElement extends HTMLElement {
  renderPlanned = false;
  strings = {};
  translationsPath = null;
  translationsFetched = false;
  props: { [key: string]: any } = {};
  constructor() {
    super();
    this.initProps();
  }
  static get observedAttributes() {
    return Object.values(this.propsDefinition);
  }

  static get propsDefinition(): { [key: string]: any } {
    return {};
  }

  initProps() {
    this.props = {};
    for (let key in this.constructor.propsDefinition) {
      this.props[key] = undefined;
    }
  }

  updateProps() {
    const declaredAttributes: string[] = [];

    // Get props values
    for (let key in this.constructor.propsDefinition) {
      const def = this.constructor.propsDefinition[key];
      if (typeof def === 'string') {
        this.props[key] = this.hasAttribute(def)
          ? this.getAttribute(def)
          : undefined;
        declaredAttributes.push(def);
      } else if (
        typeof def === 'object' &&
        def.attribute &&
        typeof def.attribute === 'string'
      ) {
        this.props[key] = this.hasAttribute(def.attribute)
          ? this.getAttribute(def.attribute)
          : def.default || undefined;
        declaredAttributes.push(def.attribute);
      }
    }

    // Add attributes to props
    for (let attr of this.attributes) {
      if (!declaredAttributes.includes(attr.name)) {
        // if attribute not in propsDefinition
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
   * Fetch all localized strings
   */
  async fetchLocaleStrings() {
    if (this.translationsFetched) return;
    const filesToFetch: any[] = [];
    if (this.translationsPath)
      // fetch component translations
      filesToFetch.push(this.fetchTranslationFile(this.translationsPath));

    const extraTranslationsPath = this.getAttribute('extra-translations-path');
    if (extraTranslationsPath)
      // fetch developer translations
      filesToFetch.push(this.fetchTranslationFile(extraTranslationsPath));

    // merge all translations
    return Promise.all(filesToFetch).then(res => {
      this.translationsFetched = true;
      this.strings = Object.assign({}, ...res);
    });
  }

  /**
   * Fetch the translation file from [path]
   */
  async fetchTranslationFile(path) {
    const ln = this.getLocale();
    const fullPath = `${path}/${ln}.json`;
    return fetch(fullPath)
      .then(result => {
        if (result.ok) {
          return result
            .json() // parse content
            .catch(e =>
              console.error(
                `Error while parsing the translation file: ${fullPath}`,
              ),
            );
        }
      })
      .catch(e =>
        console.error(
          `Error while retrieving the translation file: ${fullPath}`,
        ),
      );
  }

  /**
   * Returns current locale of app
   */
  getLocale() {
    return (
      localStorage.getItem('language') || window.navigator.language.slice(0, 2)
    );
  }

  /**
   * Return localized string for [key]
   * @param key
   */
  localize(key) {
    return this.strings[key] || key;
  }

  attributeChangedCallback() {
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

  renderCallback() {}

  render() {
    this.fetchLocaleStrings().finally(() => {
      // render even if some errors occurred
      this.innerHTML = this.template(this.props);
      this.renderCallback();
    });
  }

  template() {
    return '';
  }

  _camelize(str) {
    return str.replace(/\W+(.)/g, (match, chr) => chr.toUpperCase());
  }
}
