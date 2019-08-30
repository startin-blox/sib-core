const SorterMixin = {
  name: 'sorter-mixin',
  use: [],
  attributes: {
    orderBy: {
      type: String,
      default: null
    }
  },
  created(): void {
    this.listPostProcessors.push((resources: object[]) => this.orderCallback(resources))
  },
  orderCallback(resources: object[]): object[] {
    console.log('1. sort');
    if(this.orderBy)
      return resources.sort(this.sortValuesByKey(this.orderBy))
    return resources
  },
  sortValuesByKey(key: string): Function {
    return function (a: object, b: object): number { // need key
      if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }
      const varA = a[key].toUpperCase();
      const varB = b[key].toUpperCase();
      let comparison = 0;
      if (varA > varB) comparison = 1;
      else if (varA < varB) comparison = -1;

      return comparison
    }
  },
}

export {
  SorterMixin
}