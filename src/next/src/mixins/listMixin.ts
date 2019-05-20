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