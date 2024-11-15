import { PostProcessorRegistry } from '../../libs/PostProcessorRegistry';
import { spread } from '../../libs/lit-helpers';

import { html } from 'lit';

const AddableMixin = {
  name: 'addable-mixin',
  created() {
    this.listTemplateAdditions.attach(
      this.addableValue.bind(this),
      'AddableMixin:addableValue',
    );
  },
  getAddableAttributes() {
    const addableAttr = (Array.from(this.element.attributes) as Attr[]).filter(
      (a: Attr) => a.name.startsWith('addable-'),
    );
    const cleanAddableAttr: { [key: string]: string } = {};
    for (let attr of addableAttr)
      cleanAddableAttr[attr.name.replace('addable-', '')] = attr.value;
    if (!Object.hasOwn(cleanAddableAttr, 'data-src'))
      cleanAddableAttr['data-src'] = this.range;
    return cleanAddableAttr;
  },
  addableValue(
    template,
    listTemplateAdditions: PostProcessorRegistry,
    attributes: object,
  ) {
    const addables = this.getAddableAttributes(attributes);
    const newTemplate = html`
      ${template}
      <solid-form ...=${spread(addables)}>
      </solid-form>
    `;

    const nextProcessor = listTemplateAdditions.shift();
    if (nextProcessor) nextProcessor(newTemplate, listTemplateAdditions);
  },
};

export { AddableMixin };
