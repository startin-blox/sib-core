import { FormMixin } from '../dependencies/formMixin.js';
import { RangeMixin } from '../dependencies/rangeMixin.js';

//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { ifDefined } from 'https://unpkg.com/lit-html/directives/if-defined?module';
//@ts-ignore
import { until } from 'https://unpkg.com/lit-html/directives/until?module';

export const templateToDOMTags = {
  /**
   * DISPLAY
   */
  text: {
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
        href=${(attributes.mailto || '')+(value || '#')}
        target=${ifDefined(attributes.target)}
      >
        ${attributes.label || value || ''}
      </a>
    `,
    dependencies: []
  },

  /**
   * FORM
   */
  input: {
    template: (value: string, attributes: any) => html`
      <input
        type="text"
        name=${ifDefined(attributes.name)}
        value="${value}"
        data-holder
      />
    `,
    dependencies: [ FormMixin ]
  },
  textarea: {
    template: (value: string, attributes: any) => html`
      <textarea
        name=${ifDefined(attributes.name)}
        data-holder
      >${value}</textarea>
    `,
    dependencies: [ FormMixin ]
  },
  dropdown: {
    template: (value: string, attributes: any) => html`
      <select
        name=${ifDefined(attributes.name)}
        data-holder
      >
        <option value="" ?selected=${value === ""}>―</option>
        ${(attributes.range || []).map(el => html`
          <option
            value='{"@id": "${el['@id']}"}'
            ?selected=${value === el['@id']}
          >
            ${until(el.name)}
          </option>
        `)}
      </select>
    `,
    dependencies: [ FormMixin, RangeMixin ]
  },

  /**
   * MULTIPLE
   */
  multiple: {
    template: (value: string, attributes: any) => html`
      <solid-display
        data-src=${value || ''}
        fields="${ifDefined(attributes.fields)}"
      ></solid-display>
    `,
    dependencies: []
  }
}

/**
 * SETS
 */
export const templateToDOMTagsSet = {
  default: {
    template: () => html``,
    dependencies: []
  },
  div: {
    template: () => html`
      <div data-content></div>
    `,
    dependencies: []
  },
  ul: {
    template: () => html`
      <ul data-content></ul>
    `,
    dependencies: []
  }
}