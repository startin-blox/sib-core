//@ts-ignore
import asyncMap from 'https://dev.jspm.io/iter-tools/es2018/async-map';
//@ts-ignore
import asyncToArray from 'https://dev.jspm.io/iter-tools/es2018/async-to-array';
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
  async countResources(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    if (this.counterTemplate) {
      const resourcesToCount = await asyncToArray(resources); // create an array and consume iterator
      this.renderCounter(div, resourcesToCount.length); // count resources
      resources = await asyncMap(resource => resource, resourcesToCount); // re-create an iterator
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
  },
  renderCounter(div: HTMLElement, resourceNumber: number): void {
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

export {
  CounterMixin
}