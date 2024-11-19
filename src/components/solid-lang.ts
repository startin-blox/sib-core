import { Sib } from '../libs/Sib';
import { store } from '../libs/store/store';

import { html, render } from 'lit';

export const SolidLang = {
  name: 'solid-lang',
  use: [],
  attributes: {
    lang: {
      type: String,
      default: null,
    },
    dataLabel: {
      type: String,
      default: null,
    },
  },

  created(): void {
    this.render();
  },

  languageLoader() {
    store.selectLanguage(this.lang);
    location.reload();
  },

  render() {
    const template = html`<button @click=${this.languageLoader.bind(this)}>${this.dataLabel}</button>`;

    render(template, this.element);
  },
};

Sib.register(SolidLang);
