import { Sib } from '../libs/Sib.js';
import { BaseWidgetMixin } from './baseWidgetMixin.js';
import { DateMixin } from './valueTransformationsMixins/dateMixin.js';
import { LabelMixin } from './domAdditionsMixins/labelMixin.js';
import { LabelLastMixin } from './domAdditionsMixins/labelLastMixin.js';
import { FormMixin } from './formMixin.js';
import { MultipleMixin } from './attributeAdditions/multipleMixin.js';
import { BlankMixin } from './attributeAdditions/blankMixin.js';
import { MailtoMixin } from './attributeAdditions/mailtoMixin.js';
//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { ifDefined } from 'https://unpkg.com/lit-html/directives/if-defined?module';

export const newWidgetFactory = (tagName: string) => {

  // Use mixin
  const valueTransformations: any[] = [];
  const attributeAdditions: any[] = [];
  const domAdditions: any[] = [];
  let templateToDOM = null;

  const mixins = tagName.split('-').filter(t => t !== 'solid');

  let widgetType: object = templateToDOMTags; // choose widget type (display, form or set)
  if (mixins.includes('set')) {
    widgetType = templateToDOMTagsSet;
  }

  // build mixins array
  mixins.forEach(mixin => {
    const valueTransformationsKeys = Object.keys(valueTransformationsTags);
    const attributeAdditionsKeys = Object.keys(attributeAdditionsTags);
    const templateToDOMKeys = Object.keys(widgetType);
    const domAdditionsTagsKeys = Object.keys(domAdditionsTags);

    if (valueTransformationsKeys.includes(mixin)) {
      valueTransformations.push(valueTransformationsTags[mixin]);
    }
    if (attributeAdditionsKeys.includes(mixin)) {
      attributeAdditions.push(attributeAdditionsTags[mixin]);
    }
    if (templateToDOMKeys.includes(mixin)) {
      templateToDOM = widgetType[mixin];
    }
    if (domAdditionsTagsKeys.includes(mixin)) {
      domAdditions.push(domAdditionsTags[mixin]);
    }
  });

  const newWidget = {
    name: tagName,
    use: [
      BaseWidgetMixin,
      ...valueTransformations,
      ...attributeAdditions,
      ...domAdditions,
    ],
    get template(): Function {
      return templateToDOM || templateToDOMTags.text;
    },
  };

  Sib.register(newWidget);
};

/**
 * Value transformations
 */
const valueTransformationsTags = {
  date: DateMixin,
}

/**
 * Attribute additions
 */
const attributeAdditionsTags = {
  multiple: MultipleMixin,
  blank: BlankMixin,
  mailto: MailtoMixin,
}

/**
 * Template to DOM
 */
// Display - default
const templateToDOMTags = {
  // Display
  text: (value: string) => html`
    ${value}
  `,
  div: (value: string, attributes: any) => html`
    <div name="${ifDefined(attributes.name)}">
      ${value}
    </div>
  `,
  link: (value: string, attributes: any) => html`
    <a
      name=${ifDefined(attributes.name)}
      href=${(attributes.mailto || '')+(value || '#')}
      target=${ifDefined(attributes.target)}
    >
      ${attributes.label || value || ''}
    </a>
  `,
  // Form
  input: (value: string, attributes: any) => html`
    <input
      type="text"
      name=${ifDefined(attributes.name)}
      value="${value}"
      data-holder
    />
  `,
  textarea: (value: string, attributes: any) => html`
    <textarea
      name=${ifDefined(attributes.name)}
      data-holder
    >${value}</textarea>
  `,
  // Multiple
  multiple: (value: string, attributes: any) => html`
    <solid-display
      data-src=${value || ''}
      fields="${ifDefined(attributes.fields)}"
    ></solid-display>
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

/**
 * DOM Additions
 */
const domAdditionsTags = {
  label: LabelMixin,
  labellast: LabelLastMixin,
  form: FormMixin,
}

newWidgetFactory('solid-text');
newWidgetFactory('solid-form-input');