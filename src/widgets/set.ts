import { widgetFactory } from './widget-factory.js';

const SIBSetDiv = widgetFactory(
  'sib-set-div',
  `<div data-content></div>`,
);

const SIBSetUl = widgetFactory(
  'sib-set-ul',
  `<ul data-content></ul>`,
);

const SIBSetFieldset = widgetFactory(
  'sib-set-fieldset',
  `<fieldset data-content></fieldset>`,
);


export {
  SIBSetDiv,
  SIBSetUl,
  SIBSetFieldset
};
