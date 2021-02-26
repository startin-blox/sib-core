import { FormMixin } from '../templatesDependencies/formMixin';
import { FormCheckboxMixin } from '../templatesDependencies/formCheckboxMixin';
import { FormMinMaxMixin } from '../templatesDependencies/formMinMaxMixin';
import { FormNumberMixin } from '../templatesDependencies/formNumberMixin';
import { FormDropdownMixin } from '../templatesDependencies/formDropdownMixin';
import { FormCheckboxesMixin } from '../templatesDependencies/formCheckboxesMixin';
import { FormRadioMixin } from '../templatesDependencies/formRadioMixin';
import { FormFileMixin } from '../templatesDependencies/formFileMixin';
import { MultipleFormMixin } from '../templatesDependencies/multipleFormMixin';
import { MultipleselectFormMixin } from '../templatesDependencies/multipleselectFormMixin';
import { RangeMixin } from '../templatesDependencies/rangeMixin';
import { FilterRangeFormMixin } from '../templatesDependencies/filterRangeFormMixin';
import { ValueRichtextMixin } from '../templatesDependencies/valueRichtextMixin';
import { PatternMixin } from '../templatesDependencies/patternMixin';
import { FormStepMixin } from '../templatesDependencies/formStepMixin';
import { FormLengthMixin } from '../templatesDependencies/formLengthMixin';

import { html } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';
import { until } from 'lit-html/directives/until';

export const formTemplates = {
  text: {
    template: (value: string, attributes: any) => html`
      <input
        type="text"
        placeholder=${ifDefined(attributes.placeholder)}
        name=${ifDefined(attributes.name)}
        id=${ifDefined(attributes.id)}
        value=${value || ''}
        pattern=${ifDefined(attributes.pattern)}
        title=${ifDefined(attributes.title)}
        ?required=${attributes.required}
        autocomplete=${ifDefined(attributes.autocomplete)}
        data-holder
        maxlength=${ifDefined(attributes.maxlength)}
        minlength=${ifDefined(attributes.minlength)}
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FormMixin, PatternMixin, FormLengthMixin ]
  },
  textarea: {
    template: (value: string, attributes: any) => html`
      <textarea
        name=${ifDefined(attributes.name)}
        id=${ifDefined(attributes.id)}
        placeholder=${ifDefined(attributes.placeholder)}
        data-holder
        ?required=${attributes.required}
        autocomplete=${ifDefined(attributes.autocomplete)}
        maxlength=${ifDefined(attributes.maxlength)}
        minlength=${ifDefined(attributes.minlength)}
        @change=${attributes.onChange}
      >${value}</textarea>
    `,
    dependencies: [ FormMixin, FormLengthMixin ]
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
        id=${ifDefined(attributes.id)}
        ?required=${attributes.required}
        value=${ifDefined(attributes.originalValue)}
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
        value=${ifDefined(attributes.startValue)}
        />
        <input
        data-holder
        type="date"
        name="${attributes.name || ''}-end"
        @change=${attributes.onChange}
        value=${ifDefined(attributes.endValue)}
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
        id=${ifDefined(attributes.id)}
        value=${value}
        min=${ifDefined(attributes.min)}
        max=${ifDefined(attributes.max)}
        step=${ifDefined(attributes.step)}
        ?required=${attributes.required}
        data-holder
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FormNumberMixin, FormMinMaxMixin, FormMixin, FormStepMixin ]
  },
  rangenumber: {
    template: (_value: string, attributes: any) => html`
      <input
        data-holder
        type="number"
        name="${attributes.name || ''}-start"
        @change=${attributes.onChange}
        value=${ifDefined(attributes.startValue)}
      />
      <input
        data-holder
        type="number"
        name="${attributes.name || ''}-end"
        @change=${attributes.onChange}
        value=${ifDefined(attributes.endValue)}
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
        id=${ifDefined(attributes.id)}
        data-holder
        ?required=${attributes.required}
        ?multiple=${attributes.multiple}
        autocomplete=${ifDefined(attributes.autocomplete)}
        @change=${attributes.onChange}
      >
        ${!(attributes.multiple || attributes.autocomplete) ? html`
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
        ${Object.entries(attributes.enum || []).map(([key, val]) => html`
          <option
            value="${key}"
            ?selected=${!attributes.multiple ? value === key : attributes.values.includes(key)}
          >
            ${val}
          </option>
        `)}
      </select>
    `,
    dependencies: [ FormDropdownMixin, FormMixin, RangeMixin ]
  },
  radio: {
    template: (value: string, attributes: any) => html`
    <fieldset>
      <legend name=${ifDefined(attributes.name)}>${attributes.label}</legend>
        ${(attributes.range || []).map(el => html`
          <label>
            <input
              type="radio"
              name=${ifDefined(attributes.id)}
              value='{"@id": "${el['@id']}"}'
              ?required=${attributes.required}
              ?checked=${value === el['@id']}
            > <span>${until(el[attributes.optionLabel])}</span>
          </label>
        `)}
        ${Object.entries(attributes.enum || []).map(([key, val]) => html`
          <label>
            <input
              type="radio"
              value="${key}"
              name=${ifDefined(attributes.id)}
              ?required=${attributes.required}
              ?checked=${value === key}
            > <span>${val}</span>
          </label>
        `)}
    </fieldset>
    `,
    dependencies: [ FormRadioMixin, FormMixin, RangeMixin ]
  },
  multicheckbox: {
    template: (_value: string, attributes: any) => html`
      <fieldset>
        <legend name=${ifDefined(attributes.name)}>${attributes.label}</legend>
        ${(attributes.range || []).map(el => html`
          <label>
            <input
              type="checkbox"
              value='{"@id": "${el['@id']}"}'
              ?checked=${attributes.values.includes(el['@id'])}
            /> <span>${until(el[attributes.optionLabel])}</span>
          </label>
        `)}
        ${Object.entries(attributes.enum || [])
          .map(([key, val]) => html`
          <label>
            <input type="checkbox"
              value="${key}"
            /> <span>${val}</span>
          </label>
        `)}
      </fieldset>
    `,
    dependencies: [ FormCheckboxesMixin, FormMixin, RangeMixin ]
  },
  checkboxes: {
    template: (_value: string, attributes: any) => html`
      <solid-form-multicheckbox
        data-holder
        name=${ifDefined(attributes.name)}
        range=${ifDefined(attributes.range)}
        enum=${ifDefined(attributes.enum)}
        values=${ifDefined(attributes.values)}
        order-asc=${ifDefined(attributes.orderAsc)}
        order-desc=${ifDefined(attributes.orderDesc)}
        ?required=${attributes.required}
        label=${ifDefined(attributes.label)} 
      ></solid-form-multicheckbox>
    `,
    dependencies: [ MultipleselectFormMixin, FormMixin ]
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
        data-id=${ifDefined(attributes.id)}
        range=${ifDefined(attributes.range)}
        values=${ifDefined(attributes.values)}
        order-asc=${ifDefined(attributes.orderAsc)}
        order-desc=${ifDefined(attributes.orderDesc)}
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
  },
  richtext: {
    template: (_value: string, attributes: any) => html`
      <div 
        data-richtext
        name=${ifDefined(attributes.name)}
        data-holder
      ></div>
    `,
    dependencies: [ ValueRichtextMixin, FormMixin ]
  },
  color: {
    template: (_value: string, attributes: any) => html`
      <input
        type="color"
        placeholder=${ifDefined(attributes.placeholder)}
        id=${ifDefined(attributes.id)}
        name=${ifDefined(attributes.name)}
        ?required=${attributes.required}
        value=${ifDefined(attributes.originalValue)}
        data-holder
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FormMixin ]
  },
  email: {
    template: (value: string, attributes: any) => html`
      <input
        type="email"
        placeholder=${ifDefined(attributes.placeholder)}
        id=${ifDefined(attributes.id)}
        name=${ifDefined(attributes.name)}
        value=${value || ''}
        ?required=${attributes.required}
        data-holder
        maxlength=${ifDefined(attributes.maxlength)}
        minlength=${ifDefined(attributes.minlength)}
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FormMixin, FormLengthMixin ]
  },
  password: {
    template: (value: string, attributes: any) => html`
      <input
        type="password"
        placeholder=${ifDefined(attributes.placeholder)}
        id=${ifDefined(attributes.id)}
        name=${ifDefined(attributes.name)}
        value=${value || ''}
        ?required=${attributes.required}
        pattern=${ifDefined(attributes.pattern)}
        title=${ifDefined(attributes.title)}
        data-holder
        maxlength=${ifDefined(attributes.maxlength)}
        minlength=${ifDefined(attributes.minlength)}
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FormMixin, PatternMixin, FormLengthMixin ]
  },
  time: {
    template: (value: string, attributes: any) => html`
      <input
        type="time"
        placeholder=${ifDefined(attributes.placeholder)}
        name=${ifDefined(attributes.name)}
        id=${ifDefined(attributes.id)}
        value=${value || ''}
        min=${ifDefined(attributes.min)}
        max=${ifDefined(attributes.max)}
        step=${ifDefined(attributes.step)}
        ?required=${attributes.required}
        data-holder
        @change=${attributes.onChange}
      />
    `,
    dependencies: [ FormMixin, FormMinMaxMixin, FormStepMixin ]
  },
}
