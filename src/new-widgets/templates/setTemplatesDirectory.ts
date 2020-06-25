//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';

export const setTemplates = {
  default: {
    template: () => html``,
    dependencies: []
  },
  div: {
    template: () => html`
      <div data-content></div>
    `,
    dependencies: []
  },
  ul: {
    template: () => html`
      <ul data-content></ul>
    `,
    dependencies: []
  }
}