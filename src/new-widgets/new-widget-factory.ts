import { Sib } from '../libs/Sib.js';
import { BaseWidgetMixin } from './baseWidgetMixin.js';
import { DateMixin } from './valueTransformationsMixins/dateMixin.js';
//@ts-ignore
import {html} from 'https://unpkg.com/lit-html?module';

export const newWidgetFactory = (tagName: string) => {

  // Use mixin
  const valueTransformations: any[] = [];
  let templateToDOM = null;

  const mixins = tagName.split('-').filter(t => t !== 'solid');

  let widgetType: object = templateToDOMTags; // choose widget type (display, form or set)
  if (mixins.includes('set')) {
    widgetType = templateToDOMTagsSet;
  }

  // build mixins array
  mixins.forEach(mixin => {
    const valueTransformationsKeys = Object.keys(valueTransformationsTags);
    const templateToDOMKeys = Object.keys(widgetType);

    if (valueTransformationsKeys.includes(mixin)) {
      valueTransformations.push(valueTransformationsTags[mixin]);
      return;
    }
    if (templateToDOMKeys.includes(mixin)) {
      templateToDOM = widgetType[mixin];
      return;
    }
  });

  const newWidget = {
    name: tagName,
    use: [
      BaseWidgetMixin,
      ...valueTransformations,
    ],
    get template(): Function {
      return templateToDOM || templateToDOMTags.text;
    },
  };

  Sib.register(newWidget);
};

// Value transformations
const valueTransformationsTags = {
  date: DateMixin,
}

// Template to DOM
// Display - default
const templateToDOMTags = {
  text: (value: string) => html`
    ${value}
  `,
  div: (value: string, name: string) => html`
    <div name="${name}">${value}</div>
  `,
  input: (value: string) => html`
    <input value="${value}" data-holder>
  `
}

// Sets
const templateToDOMTagsSet = {
  default: () => html`
  `,
  div: () => html`
    <div data-content></div>
  `,
  ul: () => html`
    <ul data-content></ul>
  `
}

newWidgetFactory('solid-text');