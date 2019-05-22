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
  renderCounter(div: HTMLElement) {
    if (this.counterTemplate) {
      let html: string;
      try {
        html = evalTemplateString(this.counterTemplate, {
          counter: this.resources.length,
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