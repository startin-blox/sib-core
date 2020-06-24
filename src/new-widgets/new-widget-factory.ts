import { Sib } from '../libs/Sib.js';
import { BaseWidgetMixin } from './baseWidgetMixin.js';
import { DateMixin } from './valueTransformationsMixins/dateMixin.js';
import { MultilineMixin } from './valueTransformationsMixins/multilineMixin.js';
import { LabelMixin } from './domAdditionsMixins/labelMixin.js';
import { LabelLastMixin } from './domAdditionsMixins/labelLastMixin.js';
import { MultipleMixin } from './attributeAdditions/multipleMixin.js';
import { BlankMixin } from './attributeAdditions/blankMixin.js';
import { MailtoMixin } from './attributeAdditions/mailtoMixin.js';
import { TelMixin } from './attributeAdditions/telMixin.js';
import { TemplateToDOMInterface } from './interfaces.js';
import { templateToDOMTags, templateToDOMTagsSet } from './templateToDom/templateToDomTags.js';

export const newWidgetFactory = (tagName: string) => {

  // Use mixin
  const valueTransformations: any[] = [];
  const attributeAdditions: any[] = [];
  let templateToDOM: TemplateToDOMInterface|null = null;
  const domAdditions: any[] = [];

  const mixins = tagName.split('-').filter(t => t !== 'solid');

  let widgetType: object = templateToDOMTags; // choose widget type (display, form or set)
  if (mixins.includes('set')) {
    widgetType = templateToDOMTagsSet;
  }

  // build mixins array
  mixins.forEach(mixin => {
    // Features
    const valueTransformationsKeys = Object.keys(valueTransformationsTags);
    const attributeAdditionsKeys = Object.keys(attributeAdditionsTags);
    const domAdditionsTagsKeys = Object.keys(domAdditionsTags);

    if (valueTransformationsKeys.includes(mixin)) {
      valueTransformations.push(valueTransformationsTags[mixin]);
    }
    if (attributeAdditionsKeys.includes(mixin)) {
      attributeAdditions.push(attributeAdditionsTags[mixin]);
    }
    if (domAdditionsTagsKeys.includes(mixin)) {
      domAdditions.push(domAdditionsTags[mixin]);
    }

    // Template
    const templateToDOMKeys = Object.keys(widgetType);
    if (templateToDOMKeys.includes(mixin)) {
      templateToDOM = widgetType[mixin];
    }
  });

  if (!templateToDOM) {
    console.error('No widget found');
    return;
  }

  const newWidget = {
    name: tagName,
    use: [
      BaseWidgetMixin,
      ...valueTransformations,
      ...attributeAdditions,
      ...domAdditions,
      ...(templateToDOM!.dependencies || []),
    ],
    get template(): Function {
      return templateToDOM!.template || templateToDOMTags.text.template;
    },
  };

  Sib.register(newWidget);
};

/**
 * Value transformations
 */
const valueTransformationsTags = {
  date: DateMixin,
  multiline: MultilineMixin,
}

/**
 * Attribute additions
 */
const attributeAdditionsTags = {
  multiple: MultipleMixin,
  blank: BlankMixin,
  mailto: MailtoMixin,
  tel: TelMixin,
}

/**
 * DOM Additions
 */
const domAdditionsTags = {
  label: LabelMixin,
  labellast: LabelLastMixin,
}

newWidgetFactory('solid-text');
newWidgetFactory('solid-input');