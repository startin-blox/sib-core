import { html } from 'lit';
import { SetMixin } from '../templatesDependencies/setMixin.ts';

export const groupTemplates = {
  default: {
    template: (value: string) =>
      html`<span>${value}</span><div data-content></div>`,
    dependencies: [SetMixin],
  },
};
