import { widgetFactory } from './widget-factory.js';
import "https://unpkg.com/autolinker/dist/Autolinker.min.js";
/*
const SolidDisplayValue = widgetFactory(
  'solid-display-value',
  `\${value}`,
);

const SolidDisplayDiv = widgetFactory(
  'solid-display-div',
  `<div name="\${name}" \${editable?'data-editable':''}>\${value}</div>`,
);

const SolidDisplayLabelledDiv = widgetFactory(
  'solid-display-labelled-div',
  `\${value ? "<label>" + label + "</label>" : ""}
  <div name="\${name}" \${editable?'data-editable':''}>\${value}</div>`,
);

const SolidDisplayMultiline = widgetFactory(
  'solid-display-multiline',
  `\${value ? "<label>" + label + "</label>" : ""}
  <div name="\${name}">\${value.replace(/\n/g, "<br/>")}</div>`,
);

const SolidDisplayLabelledBoolean = widgetFactory(
  'solid-display-labelled-boolean',
  `\${value ? "<label>" + label + "</label>" : ""}`
);

const SolidDisplayImg = widgetFactory(
  'solid-display-img',
  `<img
    name="\${name}"
    src="\${value}"
    style="max-width: 100%; max-height: 100%;"
    />
`);

const SolidDisplayMailTo = widgetFactory(
  'solid-display-mailto',
  `<a href="mailto:\${value}" name="\${name}" \${editable?'data-editable':''}>\${label != name ? label : value}</a>
`,
);

const SolidDisplayTel = widgetFactory(
  'solid-display-tel',
  `<a
    href="tel:\${value}"
    name="\${name}"
    \${editable?'data-editable':''}
  >\${value}</a>`,
);

const SolidDisplayLink = widgetFactory(
  'solid-display-link',
  `<a
    href="\${value}"
    name="\${name}"
  >\${label}</a>`,
);

const SolidDisplayBlankLink = widgetFactory(
  'solid-display-blank-link',
  `<a
    href="\${value}"
    name="\${name}"
    target="_blank"
  >\${label}</a>`,
);

const SolidDisplayDate = widgetFactory(
  'solid-display-date',
  `\${value ? new Date(value.toString()).toLocaleDateString() : ''}`,
);

const SolidDisplayDateTime = widgetFactory(
  'solid-display-date-time',
  `\${value ? new Date(value.toString()).toLocaleString() : ''}`,
);

const SolidAction = widgetFactory(
  'solid-action',
  `<solid-link
    data-src="\${src}"
    next="\${value}"
  >\${label}</solid-link>`,
  undefined,
  element => {
    if(element.localName !== 'sib-action') return;

    const solidLink = element.querySelector('solid-link');
    if(!solidLink) return;
    const sibLink = document.createElement('sib-link');
    Array.from(solidLink.attributes).map(a => {
      sibLink.setAttribute(a.name, a.value);
    });
    element.insertBefore(sibLink, solidLink);
    solidLink.remove();
  },
);

const SolidDisplayAutolink = widgetFactory(
  'solid-display-autolink',
  `\${value}`,
  '',
  element => {
    //@ts-ignore
    element.innerHTML = Autolinker.link(element.textContent);
  },
);
*/
export {
};
