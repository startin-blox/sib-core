//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';

const LabelMixin = {
  name: 'label-mixin',
  attributes: {
    label: {
      type: String,
      default: null,
      callback: function () {
        this.planRender();
      }
    },
  },
  attached() {
    this.listTemplateAdditions.push(this.addToWidget.bind(this));
  },
  addToWidget(template, listTemplateAdditions: Function[]) {
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