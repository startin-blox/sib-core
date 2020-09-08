import { Sib } from '../libs/Sib.js';

export const SolidLang = {
  name: 'solid-lang',
  use: [],
  attributes: {
    lang: {
      type: String,
      default: null
    },
    dataLabel: {
      type: String,
      default: null
    }
  },

  created(): void {
    this.render();
  },

  languageLoader () {
    console.log(this.lang);
    store.selectLanguage(this.lang);
    location.reload();
  },
  
  render(): void {
    const button = document.createElement('button');
    button.textContent = this.dataLabel;
    this.element.appendChild(button);
    button.addEventListener('click', this.languageLoader.bind(this));
  }
};

Sib.register(SolidLang);