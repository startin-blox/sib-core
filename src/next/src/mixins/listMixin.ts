import { store } from '../store.js';
import { stringToDom, evalTemplateString } from '../helpers/index.js';
import { PaginateMixin } from './paginateMixin.js';
import { FilterMixin } from './filterMixin.js';

const ListMixin = {
  name: 'list-mixin',
  use: [ FilterMixin, PaginateMixin ],
  attributes: {
    counterTemplate: {
      type: String,
      default: null
    },
    orderBy: {
      type: String,
      default: null
    },
  },
  created() {
    this.resourcesFilters.push(resources => this.orderCallback(resources))
  },
  orderCallback(resources) {
    if(this.orderBy)
      return resources.sort(this.compareValues(this.orderBy))
    return resources
  },
  compareValues(key: string, order='asc') {
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

      return (order == 'desc') ? (comparison * -1) : comparison
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