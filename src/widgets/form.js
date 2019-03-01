import { widgetFactory } from '../parents/widget-factory.js';

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

const SIBFormDropdown = customElements.define('sib-form-dropdown', widgetFactory(`
  <option value='{"@id": "\${id}"}'>\${name}</option>
`, `
  <label>
    <div>\${label}</div>
    <select name="\${name}" data-holder>
      \${range}
    </select>
  </label>
`))

const SIBFormPlaceholderDropdown = customElements.define('sib-form-placeholder-dropdown', widgetFactory(`
  <option value='{"@id": "\${id}"}'>\${name}</option>
`, `
  <select name="\${name}" data-holder>
    <option disabled>\${label}</option>
    \${range}
  </select>
  `))


const SIBFormAutoCompletion = customElements.define('sib-form-auto-completion', widgetFactory(`
  <option value='\${name}' />
`, `
  <label>
    <div>\${label}</div>
    <input type="text"
      data-holder
      type="text"
      name="\${name}"
      list="datalist" />

      <datalist id="datalist">
        \${range}
      </datalist>
  </label>
`))



export {
  SIBFormAutoCompletion,
  SIBFormCheckbox,
  SIBFormDropdown,
  SIBFormPlaceholderDropdown,
  SIBFormJSON,
  SIBFormLabelText,
  SIBFormPlaceholderText,
  SIBFormTextarea,
};
