import { FormMixin } from '../dependencies/formMixin.js';
import { MultipleFormMixin } from '../dependencies/multipleFormMixin.js';
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
  },

  /**
   * FORM
   */
  input: {
    template: (value: string, attributes: any) => html`
      <input
        type="text"
        name=${ifDefined(attributes.name)}
        value=${value}
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
  },
  multipleform: {
    template: (value: string, attributes: any) => html`
      ${(attributes.children || []).map((child, index) => html`
        <div data-index=${attributes.name + index}>
          ${child}
          <button type="button" @click=${() => attributes.removeItem(index)}>${attributes.removeLabel}</button>
        </div>
      `)}
      <button type="button" @click=${attributes.addItem}>${attributes.addLabel}</button>
    `,
    dependencies: [ MultipleFormMixin, FormMixin ]
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