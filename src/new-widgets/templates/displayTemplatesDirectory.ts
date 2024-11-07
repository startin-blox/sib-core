import { EditableMixin } from '../templatesDependencies/editableMixin';
import { AltMixin } from '../templatesDependencies/altMixin';
import { LinkTextMixin } from '../templatesDependencies/linkTextMixin';

import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

export const displayTemplates = {
  value: {
    template: (value: string) => html`${value}`,
    dependencies: []
  },
  div: {
    template: (value: string, attributes: any) => html`<div name=${ifDefined(attributes.name)} ?data-editable=${attributes.editable}>${value}</div>`,
    dependencies: [ EditableMixin ]
  },
  link: {
    template: (value: string, attributes: any) => html`
      <a
        name=${ifDefined(attributes.name)}
        href=${(attributes.mailto || attributes.tel || '')+(value || '#')}
        target=${ifDefined(attributes.target)}
        ?data-editable=${attributes.editable}
        id=${ifDefined(attributes.id)}
        link-text=${ifDefined(attributes.linkText)}
      >
        ${attributes.linkText || value || ''}
      </a>
    `,
    dependencies: [ EditableMixin,  LinkTextMixin ]
  },
  img: {
    template: (value: string, attributes: any) => html`
      <img
        name=${ifDefined(attributes.name)}
        src=${ifDefined(value)}
        alt=${ifDefined(attributes.alt)}
        style="max-width: 100%; max-height: 100%;"
      />
    `,
    dependencies: [AltMixin]
  },
  boolean: {
    template: (value: string, attributes: any) => html`${value === 'true' ? html`<label>${attributes.label || attributes.name || ''}</label>` : ''}`,
    dependencies: []
  },
}
