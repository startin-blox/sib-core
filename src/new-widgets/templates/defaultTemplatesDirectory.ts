//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { ifDefined } from 'https://unpkg.com/lit-html/directives/if-defined?module';
//@ts-ignore
import { until } from 'https://unpkg.com/lit-html/directives/until?module';

export const defaultTemplates = {
  action: {
    template: (value: string, attributes: any) => html`
      <solid-link
        data-src=${ifDefined(attributes.src)}
        next=${ifDefined(value)}
      >${attributes.label || attributes.name || ''}</solid-link>
    `,
    dependencies: []
  },
  multiple: {
    template: (value: string, attributes: any) => html`
      <solid-display
        data-src=${value || ''}
        fields=${ifDefined(attributes.fields)}
        next=${ifDefined(attributes.next)}
      ></solid-display>
    `,
    dependencies: []
  },
}
