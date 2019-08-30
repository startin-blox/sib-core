import { PaginateMixin } from './paginateMixin.js';
import { FilterMixin } from './filterMixin.js';
import { CounterMixin } from './counterMixin.js';
import { SorterMixin } from './sorterMixin.js';
import { grouperMixin } from './grouperMixin.js';
import { FederationMixin } from './federationMixin.js';
import { HighlighterMixin } from './highlighterMixin.js';

const ListMixin = {
  name: 'list-mixin',
  use: [ PaginateMixin, grouperMixin, CounterMixin, HighlighterMixin, FilterMixin, SorterMixin, FederationMixin ],
  attributes: {
    emptyWidget: {
      type: String,
      default: null
    },
    emptyValue: {
      type: String,
      default: ''
    }
  },
  initialState: {
    listPostProcessors: [],
    listRenderingCallbacks: [],
    resources: [],
  },
  created() {
    this.resources = [];
  },
  appendSingleElt(parent: HTMLElement): void {
    this.appendChildElt(this.resource['@id'], parent);
  },
  /**
   * Transform resources AsyncIterator into object[]
   */
  async generateList() {
    for await (const resource of this.resource['ldp:contains']) {
      //if source, add to array
      this.resources.push({
        "@id": resource.toString(),
        name: (await resource.name).toString(),
        email: (await resource.email).toString(),
        // type: "sib:source", //(await resource['@type']).toString()
        // container: (await resource.container).toString()
      })
    }
  },
  async populate(): Promise<void> {
    const div = this.div;

    // Not a container but a single resource
    if (!(await this.resource.isContainer)) {
      this.appendSingleElt(div);
      return;
    }

    if (!this.filtersAdded && this.searchFields) { // TODO : remove after #358
      this.appendFilters();
      return;
    }

    await this.generateList();

    // Post process the list
    for (const postProcessor of this.listPostProcessors) {
      this.resources = postProcessor(this.resources)
    }

    // Nothing in list
    if (this.resources.length === 0 && this.emptyWidget) {
      const emptyWidgetElement = document.createElement(this.emptyWidget);
      emptyWidgetElement.value = this.emptyValue;
      this.div.appendChild(emptyWidgetElement);
      return;
    }

    // Create child components
    for (let resource of this.resources) {
      this.appendChildElt(resource['@id'], div);
    }

    // Process modifications on the rendered DOM
    for (let renderingCallback of this.listRenderingCallbacks) {
      renderingCallback(this.div)
    }
  }
}

export {
  ListMixin
}