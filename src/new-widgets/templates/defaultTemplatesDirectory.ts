import { FormMixin } from '../templatesDependencies/formMixin.js';
import { FormCheckboxMixin } from '../templatesDependencies/formCheckboxMixin.js';
import { MultipleFormMixin } from '../templatesDependencies/multipleFormMixin.js';
import { RangeMixin } from '../templatesDependencies/rangeMixin.js';

//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { ifDefined } from 'https://unpkg.com/lit-html/directives/if-defined?module';
//@ts-ignore
import { until } from 'https://unpkg.com/lit-html/directives/until?module';

export const defaultTemplates = {
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
  checkbox: {
    template: (value: string, attributes: any) => html`
      <label>
        <input
          data-holder
          type="checkbox"
          name=${ifDefined(attributes.name)}
          ?checked=${value === 'true'}
        >
        <div>${attributes.label || attributes.name}</div>
      </label>
    `,
    dependencies: [ FormCheckboxMixin, FormMixin ]
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
