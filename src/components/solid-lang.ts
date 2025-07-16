import { Sib } from '../libs/Sib.ts';
import { getStoreAsync } from '../libs/store/store.ts';

import { html, render } from 'lit';

const store = await getStoreAsync();
if (!store) throw new Error('Store is not available');

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
