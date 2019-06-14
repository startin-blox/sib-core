import { widgetFactory } from './widget-factory.js';

const SIBSetDiv = widgetFactory(
  'sib-set-div',
  `<div>
    \${content}
  </div>`,
);

const SIBSetUl = widgetFactory(
  'sib-set-ul',
  `<ul>
    \${content}
  </ul>`,
);

const SIBSetFieldset = widgetFactory(
  'sib-set-fieldset',
  `<fieldset>
    \${content}
  </fieldset>`,
);


export {
  SIBSetDiv,
  SIBSetUl,
  SIBSetFieldset
};
