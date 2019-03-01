import { widgetFactory } from '../../parents/widget-factory.js'

const SIBDisplayDiv = customElements.define('sib-display-div', widgetFactory(`
  <div name="\${name}">\${value}</div>
`))

const SIBDisplayImg = customElements.define('sib-display-img', widgetFactory(`
  <img
    name="\${name}"
    src="\${value}"
    style="max-width: 100%; max-height: 100%;"
    />
`))

const SIBDisplayMailTo = customElements.define('sib-display-mailto', widgetFactory(`
  <a href="mailto:\${value}" name="\${name}">\${value}</a>
`))

const SIBDisplayTel = customElements.define('sib-display-tel', widgetFactory(`
  <a href="tel:\${value}" name="\${name}">\${value}</a>
`))

const SIBAction = customElements.define('sib-action', widgetFactory(`
  <sib-link data-src="\${src}" next="\${value}">\${name}</sib-link>
`))

export {
  SIBDisplayDiv,
  SIBDisplayImg,
  SIBDisplayMailTo,
  SIBDisplayTel,
  SIBAction,
};
