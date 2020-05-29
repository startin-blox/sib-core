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
    this.listDomAdditions.push(this.addToWidget.bind(this));
  },
  addToWidget(template, domAdditions: Function[]) {
    console.time('temp');
    const newTemplate = html`
      <label>${this.label}</label>
      ${template}
    `;
    console.timeEnd('temp');


    const nextProcessor = domAdditions.shift();
    if(nextProcessor) nextProcessor(newTemplate, domAdditions);
  }
}

export {
  LabelMixin
}