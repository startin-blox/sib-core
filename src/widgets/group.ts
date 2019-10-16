import { widgetFactory } from './widget-factory.js';

const SolidGroupDiv = widgetFactory(
  'solid-group-div',
  `<div data-content>
    <span data-title></span>
  </div>`,
);

export {
  SolidGroupDiv,
};
