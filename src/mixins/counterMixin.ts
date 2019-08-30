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
    countResources: 0
  },
  created() {
    this.listPostProcessors.push((resources: object[]) => this.countResources(resources))
    this.listRenderingCallbacks.push((parent: HTMLElement) => this.renderCounter(parent))
  },
  countResources(resources: object[]) {
    console.log('4. count');
    this.countResources = resources.length;
    return resources;
  },
  renderCounter(div: HTMLElement): void {
    if (this.counterTemplate) {
      let html: string;
      try {
        html = evalTemplateString(this.counterTemplate, {
          counter: this.countResources,
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