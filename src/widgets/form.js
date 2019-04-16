import { widgetFactory } from '../parents/widget-factory.js';
import { importCSS } from '../helpers/index.js';
import Choices from 'https://dev.jspm.io/choices.js@4';

const SIBFormLabelText = widgetFactory(
  'sib-form-label-text',
  `<label>
    <div>\${label}</div>
    <input
      data-holder
      type="text"
      name="\${name}"
      value="\${escapedValue}"
    >
  </label>`,
);

const SIBFormCheckbox = widgetFactory(
  'sib-form-checkbox',
  `<label>
    <input
      data-holder
      type="checkbox"
      name="\${name}"
      \${value ? 'checked' : ''}
    >
    <div>\${label}</div>
  </label>`,
);

const SIBFormDate = widgetFactory(
  'sib-form-date',
  `<label>
    <div>\${label}</div>
    <input
      data-holder
      type="date"
      name="\${name}"
      value="\${escapedValue}"
    >
  </label>`,
);

const SIBFormRangeDate = widgetFactory(
  'sib-form-range-date',
  `<label>
    <div>\${label}</div>
    <input
      data-holder
      type="date"
      name="\${name}-start"
      value="\${value[0]||''}" />
    <input
      data-holder
      type="date"
      name="\${name}-end"
      value="\${value[1]||''}" />
  </label>`,
);

const SIBFormJSON = widgetFactory(
  'sib-form-json',
  `<label>
    <div>\${label}</div>
    <input
      data-holder
      type="text"
      name="\${name}"
      value='\${JSON.stringify(value)}'
    >
  </label>`,
);

const SIBFormPlaceholderText = widgetFactory(
  'sib-form-placeholder-text',
  `<input
    data-holder
    placeholder="\${label}"
    type="text"
    name="\${name}"
    value="\${escapedValue}"
  >`,
);

const SIBFormTextarea = widgetFactory(
  'sib-form-textarea',
  `<label>
    <div>\${label}</div>
    <textarea
      data-holder
      name="\${name}"
    >\${escapedValue}</textarea>
  </label>`,
);

const SIBFormPlaceholderTextarea = widgetFactory(
  'sib-form-placeholder-textarea',
  `<textarea
    data-holder
    placeholder="\${label}"
    name="\${name}"
  >\${escapedValue}</textarea>`,
);

const SIBFormDropdown = widgetFactory(
  'sib-form-dropdown',
  `<label>
    <div>\${label}</div>
    <select name="\${name}" data-holder>
    <option value="" \${value == "" ? 'selected' : ''}>―</option>
      \${range}
    </select>
  </label>
`,
  `
  <option value='{"@id": "\${id}"}'>\${name}</option>`,
);

const SIBFormPlaceholderDropdown = widgetFactory(
  'sib-form-placeholder-dropdown',
  `<select name="\${name}" data-holder>
    <option value="" \${value == "" ? 'selected' : ''}>\${label}</option>
    \${range}
  </select>
`,
  `
  <option value='{"@id": "\${id}"}'>\${name}</option>`,
);

const SIBFormAutoCompletion = widgetFactory(
  'sib-form-auto-completion',
  `<label>
    <div>\${label}</div>
    <select name="\${name}" data-holder \${multiple?'multiple':''}>
      \${range}
    </select>
  </label>
`,
  `
  <option value="\${id}">\${name}</option>
`,
  formWidget => {
    let select = formWidget.querySelector('select');
    if (!select) return;
    new Choices(select, { removeItemButton: true });
    importCSS('https://dev.jspm.io/npm:choices.js@4/public/assets/styles/choices.min.css');
  },
);

const SIBFormNumber = widgetFactory(
  'sib-form-number',
  `<label>
    <div>\${label}</div>
    <input
      data-holder
      type="number"
      name="\${name}"
      value="\${value}"
    >
  </label>`,
);

const SIBFormRangeNumber = widgetFactory(
  'sib-form-range-number',
  `<label>
    <div>\${label}</div>
    <input
      data-holder
      type="number"
      name="\${name}-start"
      value="\${value[0]||''}" />
    <input
      data-holder
      type="number"
      name="\${name}-end"
      value="\${value[1]||''}" />
  </label>`,
);

const SIBFormHidden = widgetFactory(
  'sib-form-hidden',
  `<input
    data-holder
    type="hidden"
    name="\${name}"
    value="\${escapedValue}"
  >`,
);

export {
  SIBFormAutoCompletion,
  SIBFormCheckbox,
  SIBFormDate,
  SIBFormRangeDate,
  SIBFormDropdown,
  SIBFormPlaceholderDropdown,
  SIBFormJSON,
  SIBFormLabelText,
  SIBFormNumber,
  SIBFormRangeNumber,
  SIBFormPlaceholderText,
  SIBFormTextarea,
  SIBFormHidden,
};
