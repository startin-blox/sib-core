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
      if (window.fetchPromise === undefined) { // if translation data are not already fetched
        window.fetchPromise = fetch(`../../locales/${languageStorage}.json`)
        .then(response => {
          if (!response.ok) return;
          return response.json() // catch data in translation file
        })
      }
      window.fetchPromise.then(res =>{
        this.translationData = res; // stock data in object passed to traduction method below
        this.update(); // update the rendering in components and widgets
      })
    }
  },
  t(tradKey){
    return this.translationData[tradKey] || '';
  }
}

export {
  TranslationMixin
}