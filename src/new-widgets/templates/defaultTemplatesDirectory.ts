import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { LinkTextMixin } from '../templatesDependencies/linkTextMixin.ts';

export const defaultTemplates = {
  action: {
    template: (value: string, attributes: any) => html`
      <solid-link
        data-src=${ifDefined(attributes.src)}
        next=${ifDefined(value)}
        id=${ifDefined(attributes.id)}
        link-text=${ifDefined(attributes.linkText)}
      >
        ${attributes.linkText == null ? attributes.name || '' : attributes.linkText}
      </solid-link>
    `,
    dependencies: [LinkTextMixin],
  },
  multiple: {
    template: (value: string, attributes: any) => html`
      <solid-display
        data-src=${value || ''}
        fields=${ifDefined(attributes.fields)}
        next=${ifDefined(attributes.next)}
        empty-widget=${ifDefined(attributes.emptyWidget)}
      ></solid-display>
    `,
    dependencies: [],
  },
};
