import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from './widgetMixin.js';
import { DateMixin } from './valueTransformationsMixins/dateMixin.js';
//@ts-ignore
import {html} from 'https://unpkg.com/lit-html?module';

export const newWidgetFactory = (tagName: string) => {

  // Use mixin
  const valueTransformations: any[] = [];
  let templateToDOM = null;

  const mixins = tagName.split('-').filter(t => t !== 'solid');
  mixins.forEach(mixin => {
    const valueTransformationsKeys = Object.keys(valueTransformationsTags);
    const templateToDOMKeys = Object.keys(templateToDOMTags);

    if (valueTransformationsKeys.includes(mixin)) {
      valueTransformations.push(valueTransformationsTags[mixin]);
      return;
    }
    if (templateToDOMKeys.includes(mixin)) {
      templateToDOM = templateToDOMTags[mixin];
      return;
    }
  });

  const newWidget = {
    name: tagName,
    use: [
      WidgetMixin,
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

newWidgetFactory('solid-text');