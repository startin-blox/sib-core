import { widgetFactory } from '../parents/widget-factory.js';

const SIBDisplayValue = widgetFactory(
  'sib-display-value',
  `\${value}`,
);

const SIBDisplayDiv = widgetFactory(
  'sib-display-div',
  `<div name="\${name}">\${value}</div>`,
);

const SIBDisplayLabelledDiv = widgetFactory(
  'sib-display-labelled-div',
  `\${value ? "<label>" + label + "</label>" : ""}
  <div name="\${name}">\${value}</div>`,
);

const SIBDisplayLabelledBoolean = widgetFactory(
  'sib-display-labelled-boolean',
  `\${value ? "<label>" + label + "</label>" : ""}`
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
  `<a href="mailto:\${value}" name="\${name}">\${value}</a>
`,
);

const SIBDisplayTel = widgetFactory(
  'sib-display-tel',
  `<a
    href="tel:\${value}"
    name="\${name}"
  >\${value}</a>`,
);

const SIBDisplayLink = widgetFactory(
  'sib-display-link',
  `<a
    href="\${value}"
    name="\${name}"
  >\${label}</a>`,
);

const SIBAction = widgetFactory(
  'sib-action',
  `<sib-link
    data-src="\${src}"
    next="\${value}"
  >\${label}</sib-link>`,
);


export {
  SIBDisplayValue,
  SIBDisplayDiv,
  SIBDisplayLabelledDiv,
  SIBDisplayLabelledBoolean,
  SIBDisplayImg,
  SIBDisplayMailTo,
  SIBDisplayTel,
  SIBDisplayLink,
  SIBAction,
};
