//@ts-ignore
import asyncMap from 'https://dev.jspm.io/iter-tools@6/es2015/async-map';
//@ts-ignore
import asyncToArray from 'https://dev.jspm.io/iter-tools@6/es2015/async-to-array';

const SorterMixin = {
  name: 'sorter-mixin',
  use: [],
  attributes: {
    orderBy: {
      type: String,
      default: null
    },
    orderByRandom: {
      type: String,
      default: null
    }
  },
  attached(): void {
    this.listPostProcessors.push(this.orderCallback.bind(this));
  },
  async orderCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    if (this.orderBy) {
      resources = await asyncMap(async (resource) => ({
        sortingKey: await resource[this.orderBy], // fetch sorting value
        proxy: resource // and keep proxy
      }), resources);
      resources = await asyncToArray(resources); // tranform in array
      resources = resources.sort(this.sortValuesByKey("sortingKey")); // sort this array
      resources = await asyncMap(resource => resource.proxy, resources); // and re-transform in async iterator
    } else if (this.isRandomSorted) {
      resources = await asyncToArray(resources); // tranform in array
      resources = this.shuffleResources(resources); // shuffle resources
      resources = await asyncMap(resource => resource, resources); // and re-transform in async iterator
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
  },
  isRandomSorted(): boolean {
    return this.orderByRandom !== null;
  },
  sortValuesByKey(key: string): Function {
    return function (a: object, b: object): number {
      if (!a[key] || !b[key]) {
        return 0; // property doesn't exist on either object
      }
      const varA = a[key].toUpperCase();
      const varB = b[key].toUpperCase();
      let comparison = 0;
      if (varA > varB) comparison = 1;
      else if (varA < varB) comparison = -1;

      return comparison;
    }
  },
  shuffleResources(array: object[]): object[] {
    let currentIndex = array.length;
    let temporaryValue: object;
    let randomIndex: number;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }
}

export {
  SorterMixin
}