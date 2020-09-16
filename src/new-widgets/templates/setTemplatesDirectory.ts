import { html } from 'lit-html';

export const setTemplates = {
  default: {
    template: () => html``,
    dependencies: []
  },
  div: {
    template: () => html`<div data-content></div>`,
    dependencies: []
  },
  ul: {
    template: () => html`<ul data-content></ul>`,
    dependencies: []
  }
}