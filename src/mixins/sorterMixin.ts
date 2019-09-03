const SorterMixin = {
  name: 'sorter-mixin',
  use: [],
  attributes: {
    orderBy: {
      type: String,
      default: null
    }
  },
  attached(): void {
    this.listPostProcessors.push(this.orderCallback.bind(this));
  },
  orderCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, toExecuteNext: number): void {
    if (this.orderBy) resources = resources.sort(this.sortValuesByKey(this.orderBy));
    this.listPostProcessors[toExecuteNext](resources, listPostProcessors, div, toExecuteNext + 1);
  },
  sortValuesByKey(key: string): Function {
    return function (a: object, b: object): number { // need key
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }
      const varA = a[key].toUpperCase();
      const varB = b[key].toUpperCase();
      let comparison = 0;
      if (varA > varB) comparison = 1;
      else if (varA < varB) comparison = -1;

      return comparison;
    }
  },
}

export {
  SorterMixin
}