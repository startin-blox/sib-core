import { html } from 'lit-html';
import { SetMixin } from '../templatesDependencies/setMixin';

export const setTemplates = {
  default: {
    template: () => html``,
    dependencies: [ SetMixin ]
  },
  div: {
    template: () => html`<div data-content></div>`,
    dependencies: [ SetMixin ]
  },
  ul: {
    template: () => html`<ul data-content></ul>`,
    dependencies: [ SetMixin ]
  }
}