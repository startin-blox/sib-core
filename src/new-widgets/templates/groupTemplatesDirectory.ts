import { html } from 'lit-html';

export const groupTemplates = {
  default: {
    template: (value: string) => html`
      <span>${value}</span>
      <div data-content></div>
    `,
    dependencies: []
  },
}