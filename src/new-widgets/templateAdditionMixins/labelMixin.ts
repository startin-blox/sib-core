import { html } from 'lit-html';

const LabelMixin = {
  name: 'label-mixin',
  created() {
    this.listTemplateAdditions.push(this.addLabel.bind(this));
  },
  addLabel(template, listTemplateAdditions: Function[]) {
    const newTemplate = html`
      <label>${this.label || this.name}</label>
      ${template}
    `;

    const nextProcessor = listTemplateAdditions.shift();
    if(nextProcessor) nextProcessor(newTemplate, listTemplateAdditions);
  }
}

export {
  LabelMixin
}