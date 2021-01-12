import { html } from 'lit-html';
import { uniqID } from '../../libs/helpers';

const LabelMixin = {
  name: 'label-mixin',
  created() {
    this.listAttributes['id'] = uniqID();    
    this.listTemplateAdditions.push(this.addLabel.bind(this));
  },
  addLabel(template, listTemplateAdditions: Function[]) {
    const newTemplate = html`
      <label for="${this.listAttributes['id']}">${this.label || this.name}</label>
      ${template}
    `;

    const nextProcessor = listTemplateAdditions.shift();
    if(nextProcessor) nextProcessor(newTemplate, listTemplateAdditions);
  }
}

export {
  LabelMixin
}