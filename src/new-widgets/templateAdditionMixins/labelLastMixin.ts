//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';

const LabelLastMixin = {
  name: 'label-last-mixin',
  created() {
    this.listTemplateAdditions.push(this.addLabelLast.bind(this));
  },
  addLabelLast(template, listTemplateAdditions: Function[]) {
    const newTemplate = html`
      ${template}
      <label>${this.label || this.name}</label>
    `;

    const nextProcessor = listTemplateAdditions.shift();
    if(nextProcessor) nextProcessor(newTemplate, listTemplateAdditions);
  }
}

export {
  LabelLastMixin
}