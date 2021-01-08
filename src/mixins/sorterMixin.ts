const SorterMixin = {
  name: 'sorter-mixin',
  use: [],
  attributes: {
    orderBy: {
      type: String,
      default: null
    },
    orderAsc: {
      type: String,
      default: null
    },
    orderDesc: {
      type: String,
      default: null
    },
    orderByRandom: {
      type: String,
      default: null
    },
    sortedBy: {
      type:String,
      default: null,
      callback(newValue: string) {
        // if we change search form, re-populate
        if (newValue && this.searchForm && newValue !== this.searchForm.getAttribute('id')) {
          this.searchForm = null;
          this.populate();
        }
      }
    }
  },
  initialState: {
    randomOrder: null
  },
  attached(): void {
    this.listPostProcessors.push(this.orderCallback.bind(this));
  },
  created(): void {
    this.randomOrder = [];
  },
  async sorterList(): Promise<void> {
    if (!this.resource) return;
    this.empty();
    await this.populate();
  },
  linkSorterForm() {
    this.searchForm.addEventListener('formChange', () => {
      this.sorterList();
    });
  },

  async orderCallback(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {    
    if (this.orderBy) this.orderAsc = this.orderBy; // retrocompatibility. remove in 0.15
    let sortingKey = '';
    let orderValueToSort = '';

    // if order-asc or order-desc attribute
    if (this.orderAsc || this.orderDesc) {
      sortingKey = this.orderAsc || this.orderDesc;
    };
    // if sorted-by attribute (solid-form-search data used)
    if (this.sortedBy) {
      const sortedBy = this.sortedBy;
      if (sortedBy != null) {
        this.searchForm = document.getElementById(sortedBy);
        if (!this.searchForm) throw `#${sortedBy} is not in DOM`;        
    
        if (!this.searchForm.component.value.field) {
          console.warn('The attribute field does not exist')
        } else { 
          sortingKey = this.searchForm.component.value.field['value']; // else demandé par Matthieu
        }
        orderValueToSort = this.searchForm.component.value.order['value'];
        if (sortingKey == '' && orderValueToSort == '') {
          this.linkSorterForm();
        }
      }
    }
    // sorting data according to the defined value of sortingKey
    if (sortingKey) {
      let orderToSort = new Boolean;
      if (sortingKey == this.orderAsc || orderValueToSort == "asc") orderToSort  = true;
      else if (sortingKey == this.orderDesc || orderValueToSort == "desc") orderToSort = false;
      resources = (await Promise.all(resources.map(async (resource) => ({
        sortingKey: await resource[sortingKey], // fetch sorting value
        proxy: resource // and keep proxy
      }))))
      .sort(this.sortValuesByKey("sortingKey", orderToSort)) // sort this array
      .map(r => r.proxy) // re-create array
    }
    // if order-by-random attribute
    if (this.isRandomSorted()) {
      resources = this.shuffleResources(resources); // shuffle resources
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
  },
  isRandomSorted(): boolean {
    return this.orderByRandom !== null;
  },
  sortValuesByKey(key: string, asc: boolean): Function {
    return function (a: object, b: object): number {
      if (!a[key] || !b[key]) {
        return 0; // property doesn't exist on either object
      }
      const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key];
      const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key];
      let comparison = 0;
      if (varA > varB) comparison = asc ? 1 : -1;
      else if (varA < varB) comparison = asc ? -1 : 1;

      return comparison;
    }
  },
  shuffleResources(array: object[]): object[] {
    let currentIndex = array.length;
    let temporaryValue: object;
    let randomIndex: number;
    if (this.randomOrder.length !== array.length) { // if no random order existing
      this.randomOrder = [ ...Array(array.length).keys() ]; // generate array of indexes
      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = this.randomOrder[currentIndex];
        this.randomOrder[currentIndex] = this.randomOrder[randomIndex];
        this.randomOrder[randomIndex] = temporaryValue;
      }
    }
    return this.randomOrder.map((i: number) => array[i]); // rebuild array with random order
  }
}

export {
  SorterMixin
}