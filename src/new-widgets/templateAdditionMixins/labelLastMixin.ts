//@ts-ignore
import { html } from 'https://unpkg.com/lit-html?module';

const LabelLastMixin = {
  name: 'label-last-mixin',
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
    this.listDomAdditions.push(this.addToWidget.bind(this));
  },
  addToWidget(template, domAdditions: Function[]) {
    const newTemplate = html`
      ${template}
      <label>${this.label || this.name}</label>
    `;

    const nextProcessor = domAdditions.shift();
    if(nextProcessor) nextProcessor(newTemplate, domAdditions);
  }
}

export {
  LabelLastMixin
}