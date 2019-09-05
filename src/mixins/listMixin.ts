const ListMixin = {
  name: 'list-mixin',
  use: [],
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
    listPostProcessors: []
  },
  created() {
    this.listPostProcessors = [];
  },
  appendSingleElt(parent: HTMLElement): void {
    this.appendChildElt(this.resource['@id'], parent);
  },
  /**
   * Transform resources AsyncIterator into object[]
   */
  async generateList(): Promise<object[]> {
    let resources: object[] = [];

    // let attributesToWatch = [this.searchFields, this.orderBy, this.groupBy];
    // let fieldsToFetch = [];
    // for (let attribute of attributesToWatch) {
    //   if(attribute) fieldsToFetch.push(...attribute.split(',').map((a: string) => a.trim()))
    // }
    let fieldsToFetch = Array.from(new Set([ // Get all fields used by post processors
      // ...this.searchFields.split(','),
      // this.orderBy,
      this.groupBy
    ].map(f => f.trim())));

    for await (const resource of this.resource['ldp:contains']) {
      let getResource = { "@id": resource.toString() }
      for (let field of fieldsToFetch) {
        getResource[field] = (await resource[field]).toString() || '';
      }
      resources.push(getResource)
    }
    return resources;
  },

  async populate(): Promise<void> {
    const div = this.div;

    // Not a container but a single resource
    if (!(await this.resource.isContainer)) {
      this.appendSingleElt(div);
      return;
    }

    const resources = await this.generateList();
    const listPostProcessors = [...this.listPostProcessors];
    listPostProcessors.push(this.renderDOM.bind(this));

    // Execute the first post-processor of the list
    const nextProcessor = listPostProcessors.shift();
    nextProcessor(resources, listPostProcessors, div, this.dataSrc);
  },

  renderDOM(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    // Nothing in list
    if (resources.length === 0 && this.emptyWidget) {
      const emptyWidgetElement = document.createElement(this.emptyWidget);
      emptyWidgetElement.value = this.emptyValue;
      div.appendChild(emptyWidgetElement);
      return;
    }

    // Create child components
    for (let resource of resources) {
      this.appendChildElt(resource['@id'], div);
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) nextProcessor(resources, listPostProcessors, div, context);
  }
}

export {
  ListMixin
}