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
      resources = (await Promise.all(resources.map(async (resource) => ({
          sortingKey: await resource[this.orderBy], // fetch sorting value
          proxy: resource // and keep proxy
        }))))
        .sort(this.sortValuesByKey("sortingKey")) // sort this array
        .map(r => r.proxy) // re-create array
    } else if (this.isRandomSorted()) {
      resources = this.shuffleResources(resources); // shuffle resources
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