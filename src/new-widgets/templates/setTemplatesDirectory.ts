import { html } from 'lit';
import { SetMixin } from '../templatesDependencies/setMixin.ts';

export const setTemplates = {
  default: {
    template: () => html``,
    dependencies: [SetMixin],
  },
  div: {
    template: () => html`<div data-content></div>`,
    dependencies: [SetMixin],
  },
  ul: {
    template: () => html`<ul data-content></ul>`,
    dependencies: [SetMixin],
  },
};
