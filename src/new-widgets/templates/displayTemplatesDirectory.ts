//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { ifDefined } from 'https://unpkg.com/lit-html/directives/if-defined?module';

export const displayTemplates = {
  value: {
    template: (value: string) => html`
      ${value}
    `,
    dependencies: []
  },
  div: {
    template: (value: string, attributes: any) => html`
      <div name="${ifDefined(attributes.name)}">
        ${value}
      </div>
    `,
    dependencies: []
  },
  link: {
    template: (value: string, attributes: any) => html`
      <a
        name=${ifDefined(attributes.name)}
        href=${(attributes.mailto || attributes.tel || '')+(value || '#')}
        target=${ifDefined(attributes.target)}
      >
        ${attributes.label || value || ''}
      </a>
    `,
    dependencies: []
  },
  img: {
    template: (value: string, attributes: any) => html`
      <img
        name=${ifDefined(attributes.name)}
        src=${ifDefined(value)}
        style="max-width: 100%; max-height: 100%;"
      />
    `,
    dependencies: []
  }
}
