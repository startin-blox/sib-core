import { widgetFactory } from './widget-factory.js';

const SolidSetDefault = widgetFactory(
  'solid-set-default',
  ``,
);

const SolidSetDiv = widgetFactory(
  'solid-set-div',
  `<div data-content></div>`,
);

const SolidSetUl = widgetFactory(
  'solid-set-ul',
  `<ul data-content></ul>`,
);

const SolidSetFieldset = widgetFactory(
  'solid-set-fieldset',
  `<fieldset data-content></fieldset>`,
);


export {
  SolidSetDefault,
  SolidSetDiv,
  SolidSetUl,
  SolidSetFieldset
};
