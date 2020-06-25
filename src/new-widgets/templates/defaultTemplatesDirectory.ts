import { FormMixin } from '../templatesDependencies/formMixin.js';
import { MultipleFormMixin } from '../templatesDependencies/multipleFormMixin.js';

//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { ifDefined } from 'https://unpkg.com/lit-html/directives/if-defined?module';
//@ts-ignore
import { until } from 'https://unpkg.com/lit-html/directives/until?module';

export const defaultTemplates = {
  multiple: {
    template: (value: string, attributes: any) => html`
      <solid-display
        data-src=${value || ''}
        fields="${ifDefined(attributes.fields)}"
      ></solid-display>
    `,
    dependencies: []
  },

  multipleselect: {
    template: (value: string, attributes: any) => html`
      <select
        data-holder
        multiple
      >
        ${(attributes.values || []).map(el => html`
          <option
            value=${el['@id'] || ''}
          >${until(el.name)}</option>
        `)}
      </select>
    `,
    dependencies: [ MultipleFormMixin, FormMixin ]
  }
}
