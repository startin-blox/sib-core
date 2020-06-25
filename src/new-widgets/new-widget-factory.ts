import { Sib } from '../libs/Sib.js';
import { BaseWidgetMixin } from './baseWidgetMixin.js';
import { Template } from './interfaces.js';
import { MixinStaticInterface } from '../libs/interfaces.js';

import { defaultTemplates, setTemplates } from './templates/index.js';
import { valueTransformationDirectory } from './valueTransformationMixins/index.js';
import { templateAdditionDirectory } from './templateAdditionMixins/index.js';
import { attributeDirectory } from './attributeMixins/index.js';

const valueTransformationKeys = Object.keys(valueTransformationDirectory);
const attributeKeys = Object.keys(attributeDirectory);
const templateAdditionKeys = Object.keys(templateAdditionDirectory);

export const newWidgetFactory = (tagName: string) => {
  const valueTransformations: MixinStaticInterface[] = [];
  const attributes: MixinStaticInterface[] = [];
  const templateAdditions: MixinStaticInterface[] = [];
  let template: Template | null = null;

  // decompose widget name
  const mixins = tagName.split('-').filter(t => t !== 'solid');

  // choose widget type (default or set)
  let widgetType: object = defaultTemplates;
  if (mixins.includes('set')) widgetType = setTemplates;
  const templateKeys = Object.keys(widgetType);

  // build mixins array
  for (const mixin of mixins) {
    // Features
    if (valueTransformationKeys.includes(mixin)) {
      valueTransformations.push(valueTransformationDirectory[mixin]);
    }
    if (attributeKeys.includes(mixin)) {
      attributes.push(attributeDirectory[mixin]);
    }
    if (templateAdditionKeys.includes(mixin)) {
      templateAdditions.push(templateAdditionDirectory[mixin]);
    }

    // Template
    if (templateKeys.includes(mixin)) {
      template = widgetType[mixin];
    }
  }

  if (!template) {
    console.error(`No template found for widget "${tagName}"`);
    return;
  }

  // compose widget
  const newWidget = {
    name: tagName,
    use: [
      BaseWidgetMixin,
      ...valueTransformations,
      ...attributes,
      ...templateAdditions,
      ...(template!.dependencies || []),
    ],
    get template(): Function {
      return template!.template || defaultTemplates.text.template;
    },
  };

  // and register component
  Sib.register(newWidget);
};

// create default widgets
newWidgetFactory('solid-text');
newWidgetFactory('solid-input');