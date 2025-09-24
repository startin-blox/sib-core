import { Sib } from '../libs/Sib.ts';

import { html, render } from 'lit';

import { StoreService } from '../libs/store/storeService.ts';

export const SolidLang = {
  name: 'solid-lang',
  use: [],
  attributes: {
    store: {
      type: String,
      default: null,
    },
    lang: {
      type: String,
      default: null,
    },
    dataLabel: {
      type: String,
      default: null,
    },
  },
  initialState: {
    store: null,
  },
  created(): void {
    this.store = StoreService.getStore(this.element.getAttribute('store'));
    if (!this.store) {
      this.store = StoreService.getInstance();
    }
    this.render();
  },

  languageLoader() {
    this.store.selectLanguage(this.lang);
    location.reload();
  },

  render() {
    const template = html`<button @click=${this.languageLoader.bind(this)}>${this.dataLabel}</button>`;

    render(template, this.element);
  },
};

Sib.register(SolidLang);
