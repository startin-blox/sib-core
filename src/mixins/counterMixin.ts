import { stringToDom, evalTemplateString } from '../libs/helpers';

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
    counter: null
  },
  attached() {
    this.listPostProcessors.push(this.countResources.bind(this));
  },
  async countResources(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    if (this.counterTemplate) {
      await this.renderCounter(div, resources.length); // count resources
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
  },
  async renderCounter(div: HTMLElement, resourceNumber: number) {
    let html: string;
    try {
      html = await evalTemplateString(this.counterTemplate, {
        counter: resourceNumber,
      });
    } catch (e) {
      console.error(new Error('error in counter-template'), e);
      throw e;
    }
    if (!this.counter) {
      this.counter = document.createElement('div');
      this.element.insertBefore(this.counter, div);
    }
    this.counter.innerHTML = '';
    this.counter.appendChild(stringToDom(html));
  }
}

export {
  CounterMixin
}