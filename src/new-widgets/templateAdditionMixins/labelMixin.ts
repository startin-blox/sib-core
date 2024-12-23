import { html } from 'lit';
import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry.ts';
import { uniqID } from '../../libs/helpers.ts';

const LabelMixin = {
  name: 'label-mixin',
  created() {
    this.listAttributes.id = uniqID();
    this.listTemplateAdditions.attach(
      this.addLabel.bind(this),
      'LabelMixin:addLabel',
    );
  },
  addLabel(template, listTemplateAdditions: PostProcessorRegistry) {
    const newTemplate = html`<label for="${this.listAttributes.id}">${this.label || this.name}</label>${template}`;

    const nextProcessor = listTemplateAdditions.shift();
    if (nextProcessor) nextProcessor(newTemplate, listTemplateAdditions);
  },
};

export { LabelMixin };
