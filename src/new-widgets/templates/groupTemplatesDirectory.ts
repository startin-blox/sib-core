import { html } from 'lit-html';
import { SetMixin } from '../templatesDependencies/setMixin';

export const groupTemplates = {
  default: {
    template: (value: string) => html`
      <span>${value}</span>
      <div data-content></div>
    `,
    dependencies: [SetMixin]
  },
}