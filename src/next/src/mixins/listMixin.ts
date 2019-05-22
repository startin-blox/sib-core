import { store } from '../store/store.js';
import { PaginateMixin } from './paginateMixin.js';
import { FilterMixin } from './filterMixin.js';
import { CounterMixin } from './counterMixin.js';

const ListMixin = {
  name: 'list-mixin',
  use: [ FilterMixin, PaginateMixin, CounterMixin ],
  attributes: {
    orderBy: {
      type: String,
      default: null
    },
  },
  created() {
    this.resourcesFilters.push(
      resources => this.orderCallback(resources),
      resources => this.hightlightCallback(resources)
    )
  },
  hightlightCallback(resources) {
    for (let attr of this.element.attributes) {
      if (attr.name.startsWith('highlight-')) {
        const field = attr.name.split('highlight-')[1];
        for (let [index, res] of resources.entries()) {
          if (res[field] && res[field] == attr.value) {
            // put the current element at the beginning of the array
            resources.splice(0, 0, resources.splice(index, 1)[0]);
          }
        }
      }
    }
    return resources
  },
  orderCallback(resources) {
    if(this.orderBy)
      return resources.sort(this.sortValuesByKey(this.orderBy))
    return resources
  },
  sortValuesByKey(key: string) {
    return function(a, b) {
      if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }
      const varA = (typeof a[key] === 'string') ? a[key].toUpperCase() : a[key];
      const varB = (typeof b[key] === 'string') ? b[key].toUpperCase() : b[key];
      let comparison = 0;
      if (varA > varB) comparison = 1;
      else if (varA < varB) comparison = -1;

      return comparison
    }
  },
  appendSingleElt(parent) {
    this.appendChildElt(this.resource, parent);
  },
  populate() {
    const div = this.div;

    if (!this.isContainer()) {
      this.appendSingleElt();
      return;
    }
    if (!this.filtersAdded && this.searchFields) {
      this.appendFilters();
      return;
    }

    this.renderCounter(div);
    this.renderPaginationNav(div);

    for (let resource of this.currentPageResources) {
      //for federations, fetch every sib:source we find
      if (resource['@type'] !== 'sib:source') {
        this.appendChildElt(resource, div);
        continue;
      }
      store.get(resource.container, this.context).then(container => {
        for (let resource of container['ldp:contains']) {
          this.appendChildElt(resource, div);
        }
      });
    }
  }
}

export {
  ListMixin
}