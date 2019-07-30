import { widgetFactory } from './widget-factory.js';

const SIBSetDefault = widgetFactory(
  'sib-set-default',
  ``,
);

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
  SIBSetDefault,
  SIBSetDiv,
  SIBSetUl,
  SIBSetFieldset
};
