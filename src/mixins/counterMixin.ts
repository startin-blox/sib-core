import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { PostProcessorRegistry } from '../libs/PostProcessorRegistry.ts';
import { evalTemplateString } from '../libs/helpers.ts';

const CounterMixin = {
  name: 'counter-mixin',
  use: [],
  attributes: {
    counterTemplate: {
      type: String,
      default: null,
    },
  },
  initialState: {
    counter: null,
    parentCounterDiv: null,
  },
  attached() {
    this.listPostProcessors.attach(
      this.countResources.bind(this),
      'CounterMixin:countResources',
    );
  },
  async countResources(
    resources: object[],
    listPostProcessors: PostProcessorRegistry,
    div: HTMLElement,
    context: string,
  ) {
    if (this.counterTemplate) {
      this.initParentCounterDiv(div);
      this.renderCallbacks.push({
        // add counter template to render callback
        template: await this.renderCounter(resources.length),
        parent: this.parentCounterDiv,
      });
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(resources, listPostProcessors, div, context);
  },
  /**
   * Create the parent div of the counter in the component.
   * @param div: parent div where to insert the counter div
   */
  initParentCounterDiv(div: HTMLElement) {
    if (this.parentCounterDiv) return;
    this.parentCounterDiv = document.createElement('div');
    this.element.insertBefore(this.parentCounterDiv, div);
  },
  async renderCounter(resourceNumber: number) {
    let htmlCounter: string;
    try {
      htmlCounter = await evalTemplateString(this.counterTemplate, {
        counter: resourceNumber,
      });
    } catch (e) {
      console.error(new Error('error in counter-template'), e);
      throw e;
    }
    return html`${unsafeHTML(htmlCounter)}`;
  },
};

export { CounterMixin };
