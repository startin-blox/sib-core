import { Sib } from '../libs/Sib.js';
import { BaseWidgetMixin } from './baseWidgetMixin.js';
import { Template, WidgetMixinsInterface } from './interfaces.js';
import { MixinStaticInterface } from '../libs/interfaces.js';

import { defaultTemplates, displayTemplates, formTemplates, setTemplates } from './templates/index.js';
import { valueTransformationDirectory } from './valueTransformationMixins/index.js';
import { templateAdditionDirectory } from './templateAdditionMixins/index.js';
import { attributeDirectory } from './attributeMixins/index.js';
import { callbackDirectory } from './callbackMixins/index.js';

const valueTransformationKeys = Object.keys(valueTransformationDirectory);
const attributeKeys = Object.keys(attributeDirectory);
const templateAdditionKeys = Object.keys(templateAdditionDirectory);
const callbackKeys = Object.keys(callbackDirectory);

/**
 * Create and register a widget based on its tagName
 * @param tagName - string
 */
export const newWidgetFactory = (tagName: string) => {
  let widgetMixins: WidgetMixinsInterface;
  try { widgetMixins = getWidgetMixins(tagName) } // get mixins and template
  catch (e) {
    console.error(e);
    return;
  }

  const newWidget = { // compose widget
    name: tagName,
    use: [
      ...widgetMixins.mixins,
      BaseWidgetMixin, // at the end so created() is called first
    ],
    get template(): Function {
      return widgetMixins.templateMixin.template;
    },
  };

  Sib.register(newWidget); // and register component
};

/**
 * Returns mixins and the template of a widget, depending of its tagName
 * @param tagName - string
 */
function getWidgetMixins(tagName: string): WidgetMixinsInterface {
  const valueTransformations: MixinStaticInterface[] = [];
  const attributes: MixinStaticInterface[] = [];
  const templateAdditions: MixinStaticInterface[] = [];
  const callbacks: MixinStaticInterface[] = [];
  let template: Template | null = null;

  // decompose widget name
  const mixinNames = tagName.split('-').filter(t => t !== 'solid');

  // choose widget type (default or set)
  let widgetType: object = defaultTemplates;
  if (mixinNames.includes('display')) widgetType = displayTemplates;
  else if (mixinNames.includes('form')) widgetType = formTemplates;
  else if (mixinNames.includes('set')) widgetType = setTemplates;
  const templateKeys = Object.keys(widgetType);

  // build mixins array
  for (const mixin of mixinNames) {
    // features
    if (valueTransformationKeys.includes(mixin)) {
      valueTransformations.push(valueTransformationDirectory[mixin]);
    }
    if (attributeKeys.includes(mixin)) {
      attributes.push(attributeDirectory[mixin]);
    }
    if (templateAdditionKeys.includes(mixin)) {
      templateAdditions.push(templateAdditionDirectory[mixin]);
    }
    if (callbackKeys.includes(mixin)) {
      callbacks.push(callbackDirectory[mixin]);
    }

    // template
    if (templateKeys.includes(mixin)) {
      template = widgetType[mixin];
    }
  }

  if (!template) throw `No template found for widget "${tagName}"`;

  return {
    templateMixin: template,
    mixins: [
      ...valueTransformations,
      ...attributes,
      ...templateAdditions,
      ...(template.dependencies || []),
      ...callbacks,
    ]
  }
}

// create default widgets
newWidgetFactory('solid-display-value');
newWidgetFactory('solid-form-label-text');
newWidgetFactory('solid-form-dropdown');
newWidgetFactory('solid-form-file-label');
newWidgetFactory('solid-action');