import { html } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';

export const defaultTemplates = {
  action: {
    template: (value: string, attributes: any) => html`
      <solid-link
        data-src=${ifDefined(attributes.src)}
        next=${ifDefined(value)}
      >
        ${(attributes.label == null ? (attributes.name || '') : attributes.label)}
      </solid-link>
    `,
    dependencies: []
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
    dependencies: []
  },
}
