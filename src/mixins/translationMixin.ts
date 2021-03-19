import { store } from "../libs/store/store";

const TranslationMixin = {
  name: 'translation-mixin',
  use: [],
  initialState: {
    translationData:{}
  },
  created() {
    this.getLang();
  },
  getLang() {
    const languageStorage = store._getLanguage();
    if(languageStorage) {
      if (window.fetchTranslationPromise === undefined) { // if translation data are not already fetched
        window.fetchTranslationPromise = fetch(`../../locales/${languageStorage}.json`)
        .then(response => {
          if (!response.ok) {
            if (response.status == 404) { // Translation file not found, fetch existing file (en.json) to ensure something is displayed
              console.warn(`${languageStorage}.json translation file may not exist, English is setted by default`);
              return fetch(`../../locales/en.json`)
              .then(response => {
                if (!response.ok) return;
                return response.json();
              })
            }
          }
          return response.json() // catch data in translation file
        })
        .catch(err => {
          console.log("Error: "+ err);
        })
      }
      window.fetchTranslationPromise.then(res => {
        this.translationData = res; // stock data in object passed to traduction method below
        this.update(); // update the rendering in components and widgets
      })
    }
  },
  t(tradKey) {
    return this.translationData[tradKey] || '';
  }
}

export {
  TranslationMixin
}