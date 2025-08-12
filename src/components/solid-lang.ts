import { Sib } from '../libs/Sib.ts';

import { html, render } from 'lit';

import { StoreService } from '../libs/store/storeService.ts';
const store = StoreService.getInstance();
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
