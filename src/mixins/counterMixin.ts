import { html } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { evalTemplateString } from '../libs/helpers';

const CounterMixin = {
  name: 'counter-mixin',
  use: [],
  attributes: {
    counterTemplate: {
      type: String,
      default: null
    },
  },
  initialState: {
    counter: null,
    parentCounterDiv: null,
  },
  attached() {
    this.listPostProcessors.push(this.countResources.bind(this));
  },
  async countResources(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    if (this.counterTemplate) {
      this.initParentCounterDiv(div);
      this.renderCallbacks.push({
        template: await this.renderCounter(resources.length),
        parent: this.parentCounterDiv
      });
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
  },
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
  }
}

export {
  CounterMixin
}