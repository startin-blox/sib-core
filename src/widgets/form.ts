import { widgetFactory } from './widget-factory.js';
import { importCSS } from '../libs/helpers.js';
//@ts-ignore
import SlimSelect from 'https://dev.jspm.io/slim-select';
import SolidFormFile from './solid-form-file.js';
import SolidFormFileImage from './solid-form-file-image.js';

const SolidFormLabelText = widgetFactory(
  'solid-form-label-text',
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

const SolidFormCheckbox = widgetFactory(
  'solid-form-checkbox',
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

const SolidFormDate = widgetFactory(
  'solid-form-date',
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

const SolidFormRangeDate = widgetFactory(
  'solid-form-range-date',
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

const SolidFormPlaceholderDate = widgetFactory(
  'solid-form-placeholder-date',
  `<input
     data-holder
     type="date"
     placeholder="\${placeholder}"
     name="\${name}"
     value="\${escapedValue}"
   />`,
);

const SolidFormJSON = widgetFactory(
  'solid-form-json',
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

const SolidFormPlaceholderText = widgetFactory(
  'solid-form-placeholder-text',
  `<input
    data-holder
    placeholder="\${placeholder}"
    type="text"
    name="\${name}"
    value="\${escapedValue}"
  >`,
);

const SolidFormTextarea = widgetFactory(
  'solid-form-textarea',
  `<label>
    <div>\${label}</div>
    <textarea
      data-holder
      name="\${name}"
    >\${escapedValue}</textarea>
  </label>`,
);

const SolidFormPlaceholderTextarea = widgetFactory(
  'solid-form-placeholder-textarea',
  `<textarea
    data-holder
    placeholder="\${placeholder}"
    name="\${name}"
  >\${escapedValue}</textarea>`,
);

const SolidFormDropdown = widgetFactory(
  'solid-form-dropdown',
  `<label>
    <div>\${label}</div>
    <select name="\${name}" \${multiple?'multiple':''} data-holder>
      \${multiple ? "" : \`<option value="" \${value == "" ? "selected" : ""}>―</option>\`}
      \${range}
    </select>
  </label>
`,
  `
  <option value='{"@id": "\${id}"}' \${selected ? 'selected' : '' }>\${name}</option>`,
);

const SolidFormPlaceholderDropdown = widgetFactory(
  'solid-form-placeholder-dropdown',
  `<select name="\${name}" \${multiple?'multiple':''} data-holder>
    <option value="" \${value == "" ? 'selected' : ''}>\${label}</option>
    \${range}
  </select>
`,
  `
  <option value='{"@id": "\${id}"}' \${selected ? 'selected' : ''}>\${name}</option>`,
);

const SolidFormAutoCompletion = widgetFactory(
  'solid-form-auto-completion',
  `<label>
    <div>\${label}</div>
    <select name="\${name}" data-holder \${multiple?'multiple':''}>
      \${range}
    </select>
  </label>
`,
  `
  <option value='{"@id": "\${id}"}' \${selected ? 'selected' : ''}>\${name}</option>
`,
  formWidget => {
    let select = formWidget.querySelector('select');
    if (!select) return;
    const slimSelect = new SlimSelect({ select });
    importCSS('https://dev.jspm.io/slim-select/dist/slimselect.min.css');
    select.addEventListener('change', () => slimSelect.render());
  },
);

const SolidFormNumber = widgetFactory(
  'solid-form-number',
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

const SolidFormRangeNumber = widgetFactory(
  'solid-form-range-number',
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

const SolidFormHidden = widgetFactory(
  'solid-form-hidden',
  `<input
    data-holder
    type="hidden"
    name="\${name}"
    value="\${escapedValue}"
  >`,
);

const SolidFormLabelPlaceholderText = widgetFactory(
  'solid-form-label-placeholder-text',
  `<label>
    <div>\${label}</div>
    <input
      data-holder
      type="text"
      name="\${name}"
      placeholder="\${placeholder}"
      value="\${escapedValue}"
    >
  </label>`,
);

const SolidFormPlaceholderNumber = widgetFactory(
  'solid-form-placeholder-number',
  `<input
    data-holder
    placeholder="\${placeholder}"
    type="number"
    name="\${name}"
    value="\${value}"
  >`,
);

export {
  SolidFormAutoCompletion,
  SolidFormCheckbox,
  SolidFormDate,
  SolidFormRangeDate,
  SolidFormPlaceholderDate,
  SolidFormDropdown,
  SolidFormPlaceholderDropdown,
  SolidFormPlaceholderTextarea,
  SolidFormJSON,
  SolidFormLabelText,
  SolidFormNumber,
  SolidFormRangeNumber,
  SolidFormPlaceholderText,
  SolidFormTextarea,
  SolidFormHidden,
  SolidFormFile,
  SolidFormFileImage,
  SolidFormLabelPlaceholderText,
  SolidFormPlaceholderNumber,
};
