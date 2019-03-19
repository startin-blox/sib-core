import { widgetFactory } from '../parents/widget-factory.js';

const SIBDisplayDiv = widgetFactory(
  'sib-display-div',
  `<div name="\${name}">\${value}</div>`,
);

const SIBDisplayLabelledDiv = widgetFactory(
  'sib-display-labelled-div',
  `\${value ? "<label>" + label + "</label>" : ""}
  <div name="\${name}">\${value}</div>`,
);

const SIBDisplayImg = widgetFactory(
  'sib-display-img',
  `<img
    name="\${name}"
    src="\${value}"
    style="max-width: 100%; max-height: 100%;"
    />`,
);

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

const SIBAction = widgetFactory(
  'sib-action',
  `<sib-link
    data-src="\${src}"
    next="\${value}"
  >\${label}</sib-link>`,
);

export {
  SIBDisplayDiv,
  SIBDisplayLabelledDiv,
  SIBDisplayImg,
  SIBDisplayMailTo,
  SIBDisplayTel,
  SIBAction,
};
