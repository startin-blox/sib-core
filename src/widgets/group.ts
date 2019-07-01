import { widgetFactory } from './widget-factory.js';

const SIBGroupDiv = widgetFactory(
  'sib-group-div',
  `<div data-content>
    <span data-title></span>
  </div>`,
);

export {
  SIBGroupDiv,
};
