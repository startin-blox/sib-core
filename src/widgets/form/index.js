import { widgetFactory } from '../../parents/widget-factory.js'
import SIBFormAutoCompletion from './sib-form-auto-completion.js';
import SIBFormDropdown from './sib-form-dropdown.js';
import SIBFormPlaceholderDropdown from './sib-form-placeholder-dropdown.js';
import SIBFormMultipleDropdown from './sib-form-multiple-dropdown.js';
import SIBFormMultipleValue from './sib-form-multiple-value.js';

const SIBFormLabelText = customElements.define('sib-form-label-text', widgetFactory(`
  <label>
    <div>\${label}</div>
    <input
      data-holder
      type="text"
      name="\${name}"
      value="\${escapedValue}"
    >
  </label>
`))

const SIBFormCheckbox = customElements.define('sib-form-checkbox', widgetFactory(`
  <label>
    <div>\${label}</div>
    <input
      data-holder
      type="checkbox"
      name="\${name}"
      \${value ? 'checked' : ''}
    >
  </label>
`))
const SIBFormJSON = customElements.define('sib-form-json', widgetFactory(`
  <label>
    <div>\${label}</div>
    <input
      data-holder
      type="text"
      name="\${name}"
      value='\${JSON.stringify(value)}'
    >
  </label>
`))
const SIBFormPlaceholderText = customElements.define('sib-form-placeholder-text', widgetFactory(`
  <input
    data-holder
    placeholder="\${label}"
    type="text"
    name="\${name}"
    value="\${escapedValue}"
  >
`))
const SIBFormTextarea = customElements.define('sib-form-textarea', widgetFactory(`
  <label>
    <div>\${label}</div>
    <textarea
      data-holder
      type="text"
      name="\${name}"
    >\${escapedValue}</textarea>
  </label>
`))

export {
  SIBFormAutoCompletion,
  SIBFormCheckbox,
  SIBFormDropdown,
  SIBFormPlaceholderDropdown,
  SIBFormJSON,
  SIBFormLabelText,
  SIBFormMultipleDropdown,
  SIBFormMultipleValue,
  SIBFormPlaceholderText,
  SIBFormTextarea,
};
