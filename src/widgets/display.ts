import { widgetFactory } from './widget-factory.js';
import "https://unpkg.com/autolinker/dist/Autolinker.min.js";

const SIBDisplayValue = widgetFactory(
  'sib-display-value',
  `\${value}`,
);

const SIBDisplayDiv = widgetFactory(
  'sib-display-div',
  `<div name="\${name}" \${editable?'data-editable':''}>\${value}</div>`,
);

const SIBDisplayLabelledDiv = widgetFactory(
  'sib-display-labelled-div',
  `\${value ? "<label>" + label + "</label>" : ""}
  <div name="\${name}" \${editable?'data-editable':''}>\${value}</div>`,
);

const SIBDisplayMultiline = widgetFactory(
  'sib-display-multiline',
  `\${value ? "<label>" + label + "</label>" : ""}
  <div name="\${name}">\${value.replace(/\n/g, "<br/>")}</div>`,
);

const SIBDisplayLabelledBoolean = widgetFactory(
  'sib-display-labelled-boolean',
  `\${value == 'true' ? "<label>" + label + "</label>" : ""}`
);

const SIBDisplayImg = widgetFactory(
  'sib-display-img',
  `<img
    name="\${name}"
    src="\${value}"
    style="max-width: 100%; max-height: 100%;"
    />
`);

const SIBDisplayMailTo = widgetFactory(
  'sib-display-mailto',
  `<a href="mailto:\${value}" name="\${name}" \${editable?'data-editable':''}>\${label != name ? label : value}</a>
`,
);

const SIBDisplayTel = widgetFactory(
  'sib-display-tel',
  `<a
    href="tel:\${value}"
    name="\${name}"
    \${editable?'data-editable':''}
  >\${value}</a>`,
);

const SIBDisplayLink = widgetFactory(
  'sib-display-link',
  `<a
    href="\${value}"
    name="\${name}"
  >\${label}</a>`,
);

const SIBDisplayBlankLink = widgetFactory(
  'sib-display-blank-link',
  `<a
    href="\${value}"
    name="\${name}"
    target="_blank"
  >\${label}</a>`,
);

const SIBAction = widgetFactory(
  'sib-action',
  `<sib-link
    data-src="\${src}"
    next="\${value}"
  >\${label}</sib-link>`,
);

const SIBDisplayAutolink = widgetFactory(
  'sib-display-autolink',
  `\${value}`,
  '',
  content => {
    //@ts-ignore
    content.innerHTML = Autolinker.link(content.textContent);
  },
);

export {
  SIBDisplayValue,
  SIBDisplayDiv,
  SIBDisplayLabelledDiv,
  SIBDisplayMultiline,
  SIBDisplayLabelledBoolean,
  SIBDisplayImg,
  SIBDisplayMailTo,
  SIBDisplayTel,
  SIBDisplayLink,
  SIBDisplayBlankLink,
  SIBAction,
  SIBDisplayAutolink
};
