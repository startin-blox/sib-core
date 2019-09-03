import { stringToDom, evalTemplateString } from '../libs/helpers.js';

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
  countResources(resources: object[], listPostProcessors: Function[], div: HTMLElement, toExecuteNext: number) {
    this.renderCounter(div, resources.length);
    this.listPostProcessors[toExecuteNext](resources, listPostProcessors, div, toExecuteNext + 1);
  },
  renderCounter(div: HTMLElement, resourceNumber: number): void {
    if (this.counterTemplate) {
      let html: string;
      try {
        html = evalTemplateString(this.counterTemplate, {
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
}

export {
  CounterMixin
}