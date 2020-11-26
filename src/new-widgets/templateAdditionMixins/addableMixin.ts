import { spread } from '../../libs/lit-helpers';

import { html } from 'lit-html';

const AddableMixin = {
  name: 'addable-mixin',
  created() {
    this.listTemplateAdditions.push(this.addableValue.bind(this));
  },
  getAddableAttributes() {
    const addableAttr = (Array.from(this.element.attributes) as Attr[]).filter((a: Attr) => a.name.startsWith('addable-'));
    const cleanAddableAttr: { [key: string]: string } = {};
    for (let attr of addableAttr) cleanAddableAttr[attr.name.replace('addable-', '')] = attr.value;
    if (!cleanAddableAttr.hasOwnProperty('data-src')) cleanAddableAttr['data-src'] = this.range;
    return cleanAddableAttr;
  },
  addableValue(template, listTemplateAdditions: Function[], attributes: object) {
    if (!this.range) return;
    const addables = this.getAddableAttributes(attributes);
    const newTemplate = html`
      ${template}
      <solid-form ...=${spread(addables)}>
      </solid-form>
    `;

    const nextProcessor = listTemplateAdditions.shift();
    if (nextProcessor) nextProcessor(newTemplate, listTemplateAdditions);
  }
}

export {
  AddableMixin
}