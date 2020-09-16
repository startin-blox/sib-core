import { EditableMixin } from '../templatesDependencies/editableMixin.js';

import { html } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';

export const displayTemplates = {
  value: {
    template: (value: string) => html`${value}`,
    dependencies: []
  },
  div: {
    template: (value: string, attributes: any) => html`
      <div
        name=${ifDefined(attributes.name)}
        ?data-editable=${attributes.editable}
      >
        ${value}
      </div>
    `,
    dependencies: [ EditableMixin ]
  },
  link: {
    template: (value: string, attributes: any) => html`
      <a
        name=${ifDefined(attributes.name)}
        href=${(attributes.mailto || attributes.tel || '')+(value || '#')}
        target=${ifDefined(attributes.target)}
        ?data-editable=${attributes.editable}
      >
        ${attributes.label || value || ''}
      </a>
    `,
    dependencies: [ EditableMixin ]
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
  },
  boolean: {
    template: (value: string, attributes: any) => html`
      ${value === 'true' ? html`<label>${attributes.label || attributes.name || ''}</label>` : ''}
    `,
    dependencies: []
  },
}
