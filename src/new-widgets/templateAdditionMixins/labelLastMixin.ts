import { html } from 'lit';
import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry';

const LabelLastMixin = {
  name: 'label-last-mixin',
  created() {
    this.listTemplateAdditions.attach(
      this.addLabelLast.bind(this),
      'LabelLastMixin:addLabelLast',
    );
  },
  addLabelLast(template, listTemplateAdditions: PostProcessorRegistry) {
    const newTemplate = html`${template}<label>${this.label || this.name}</label>`;

    const nextProcessor = listTemplateAdditions.shift();
    if (nextProcessor) nextProcessor(newTemplate, listTemplateAdditions);
  },
};

export { LabelLastMixin };
