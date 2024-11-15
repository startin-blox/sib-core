import { store } from '../libs/store/store';

const TranslationMixin = {
  name: 'translation-mixin',
  use: [],
  initialState: {
    translationData: {},
  },
  created() {
    this.getLang();
  },
  /**
   * Returns the translation module
   * @param langCode - string: language needed in 2 char
   * @returns - object: {key: translation}
   */
  async getTranslationModule(langCode: string) {
    const translationsModules = {
      // define modules in a static way, snowpack does not support dynamic strings here
      en: () => import('../locales/en.json'),
      fr: () => import('../locales/fr.json'),
    };
    if (!translationsModules[langCode]) {
      // set default to EN if the file does not exist
      console.warn(
        `${langCode}.json translation file may not exist, English is setted by default`,
      );
      langCode = 'en';
    }
    const module = await translationsModules[langCode]();
    return module.default;
  },
  /**
   * Loads the right translation file and reload the component
   */
  getLang() {
    const languageStorage = store._getLanguage();
    if (languageStorage) {
      if (window.fetchTranslationPromise === undefined) {
        // if translation data are not already fetched
        window.fetchTranslationPromise =
          this.getTranslationModule(languageStorage);
      }
      window.fetchTranslationPromise.then(res => {
        if (res) {
          this.translationData = res; // stock data in object passed to traduction method below
          this.update(); // update the rendering in components and widgets
        }
      });
    }
  },
  /**
   * Returns translation for a given key
   * @param tradKey - string: key
   * @returns - string: translation
   */
  t(tradKey: string) {
    return this.translationData[tradKey] || '';
  },
};

export { TranslationMixin };
