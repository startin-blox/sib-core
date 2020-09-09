import { Sib } from '../libs/Sib.js';

//@ts-ignore
import { html, render } from 'https://unpkg.com/lit-html?module';

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
    store.selectLanguage(this.lang);
    location.reload();
  },

  render() {
    let template = html`
    <button
      @click=${this.languageLoader.bind(this)}
    >
      ${this.dataLabel}
    </button>
    `;

    render(template, this.element);
  }
};

Sib.register(SolidLang);