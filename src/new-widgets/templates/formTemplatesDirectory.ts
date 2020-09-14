import { FormMixin } from '../templatesDependencies/formMixin.js';
import { FormCheckboxMixin } from '../templatesDependencies/formCheckboxMixin.js';
import { FormNumberMixin } from '../templatesDependencies/formNumberMixin.js';
import { FormDropdownMixin } from '../templatesDependencies/formDropdownMixin.js';
import { FormRadioMixin } from '../templatesDependencies/formRadioMixin.js';
import { FormFileMixin } from '../templatesDependencies/formFileMixin.js';
import { MultipleFormMixin } from '../templatesDependencies/multipleFormMixin.js';
import { MultipleselectFormMixin } from '../templatesDependencies/multipleselectFormMixin.js';
import { RangeMixin } from '../templatesDependencies/rangeMixin.js';
import { FilterRangeFormMixin } from '../templatesDependencies/filterRangeFormMixin.js';

//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { ifDefined } from 'https://unpkg.com/lit-html/directives/if-defined?module';
//@ts-ignore
import { until } from 'https://unpkg.com/lit-html/directives/until?module';

export const formTemplates = {
  text: {
    template: (value: string, attributes: any) => html`
      <input
        type="text"
        placeholder=${ifDefined(attributes.placeholder)}
        name=${ifDefined(attributes.name)}
        value=${value || ''}
        ?required=${attributes.required}
        data-holder
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FormMixin ]
  },
  textarea: {
    template: (value: string, attributes: any) => html`
      <textarea
        name=${ifDefined(attributes.name)}
        placeholder=${ifDefined(attributes.placeholder)}
        data-holder
        ?required=${attributes.required}
        @change=${attributes.onChange}
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
          ?required=${attributes.required}
          ?checked=${value === 'true'}
          @change=${attributes.onChange}
        >
        <div>${attributes.label || attributes.name}</div>
      </label>
    `,
    dependencies: [ FormCheckboxMixin, FormMixin ]
  },
  date: {
    template: (_value: string, attributes: any) => html`
      <input
        type="date"
        placeholder=${ifDefined(attributes.placeholder)}
        name=${ifDefined(attributes.name)}
        ?required=${attributes.required}
        value=${attributes.originalValue ? new Date(attributes.originalValue).toISOString().split('T')[0] : ''}
        data-holder
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FormMixin ]
  },
  rangedate: {
    template: (_value: string, attributes: any) => html`
      <input
        data-holder
        type="date"
        name="${attributes.name || ''}-start"
        @change=${attributes.onChange}
      />
      <input
        data-holder
        type="date"
        name="${attributes.name || ''}-end"
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FilterRangeFormMixin, FormMixin ]
  },
  number: {
    template: (value: string, attributes: any) => html`
      <input
        type="number"
        placeholder=${ifDefined(attributes.placeholder)}
        name=${ifDefined(attributes.name)}
        value=${value}
        min=${attributes.min}
        max=${attributes.max}
        ?required=${attributes.required}
        data-holder
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FormNumberMixin, FormMixin ]
  },
  rangenumber: {
    template: (_value: string, attributes: any) => html`
      <input
        data-holder
        type="number"
        name="${attributes.name || ''}-start"
        @change=${attributes.onChange}
      />
      <input
        data-holder
        type="number"
        name="${attributes.name || ''}-end"
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FilterRangeFormMixin, FormNumberMixin, FormMixin ]
  },
  hidden: {
    template: (value: string, attributes: any) => html`
      <input
        type="hidden"
        name=${ifDefined(attributes.name)}
        value=${value}
        data-holder
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FormMixin ]
  },
  dropdown: {
    template: (value: string, attributes: any) => html`
      <select
        name=${ifDefined(attributes.name)}
        data-holder
        ?required=${attributes.required}
        ?multiple=${attributes.multiple}
        @change=${attributes.onChange}
      >
        ${!attributes.multiple ? html`
        <option value="" ?selected=${value === ""}>
          ${attributes.placeholder || '-'}
        </option>
        ` : ''}
        ${(attributes.range || []).filter(el => el !== null).map(el => html`
          <option
            value='{"@id": "${el['@id']}"}'
            ?selected=${!attributes.multiple ? value === el['@id'] : attributes.values.includes(el['@id'])}
          >
            ${until(el[attributes.optionLabel])}
          </option>
        `)}
      </select>
    `,
    dependencies: [ FormDropdownMixin, FormMixin, RangeMixin ]
  },
  radio: {
    template: (value: string, attributes: any) => html`
      <div
        name=${ifDefined(attributes.name)}
      >
        ${(attributes.range || []).map(el => html`
          <label>
            <input
              type="radio"
              name=${ifDefined(attributes.id)}
              value='{"@id": "${el['@id']}"}'
              ?required=${attributes.required}
              ?checked=${value === el['@id']}
            > ${until(el[attributes.optionLabel])}
          </label>
        `)}
      </select>
    `,
    dependencies: [ FormRadioMixin, FormMixin, RangeMixin ]
  },
  multiple: {
    template: (_value: string, attributes: any) => html`
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
    template: (_value: string, attributes: any) => html`
      <solid-form-dropdown
        data-holder
        name=${ifDefined(attributes.name)}
        range=${ifDefined(attributes.range)}
        values=${ifDefined(attributes.values)}
        ?required=${attributes.required}
        multiple
      ></solid-form-dropdown>
    `,
    dependencies: [ MultipleselectFormMixin, FormMixin ]
  },
  file: {
    template: (value: string, attributes: any) => html`
      <div>
        <input
          data-holder
          type="text"
          ?required=${attributes.required}
          name=${ifDefined(attributes.name)}
          value=${value || ''}
        >
        <input
          type="file"
          id=${ifDefined(attributes.id)}
          value=${ifDefined(attributes.fileValue)}
          ?required=${attributes.required}
          @change=${attributes.selectFile}
        />
        <button
          ?hidden=${attributes.resetButtonHidden}
          @click=${attributes.resetFile}
        >×</button>
        <span>${attributes.output}</span>
      </div>
    `,
    dependencies: [ FormFileMixin, FormMixin ]
  },
  image: {
    template: (value: string, attributes: any) => html`
      <div>
        <input
          data-holder
          type="text"
          name=${ifDefined(attributes.name)}
          value=${value || ''}
        >
        <input
          type="file"
          accept="image/*"
          id=${ifDefined(attributes.id)}
          value=${ifDefined(attributes.fileValue)}
          ?required=${attributes.required}
          @change=${attributes.selectFile}
        />
        <img
          src=${value || ''}
          ?hidden=${value === ''}
        />
        <button
          ?hidden=${attributes.resetButtonHidden}
          @click=${attributes.resetFile}
        >×</button>
        <span>${attributes.output}</span>
      </div>
    `,
    dependencies: [ FormFileMixin, FormMixin ]
  }
}
