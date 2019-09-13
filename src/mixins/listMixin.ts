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
  async populate(): Promise<void> {
    const div = this.div;

    // Not a container but a single resource
    if (this.resource && !(await this.resource.isContainer())) {
      this.appendSingleElt(div);
      return;
    }

    const listPostProcessors = [...this.listPostProcessors];
    listPostProcessors.push(this.renderDOM.bind(this));

    // Execute the first post-processor of the list
    const nextProcessor = listPostProcessors.shift();
    await nextProcessor(this.resource['ldp:contains'], listPostProcessors, div, this.dataSrc);
  },

  async renderDOM(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    // Create child components
    let childrenAdded = 0;
    for await (let resource of resources) {
      this.appendChildElt(resource.toString(), div); // toString on resource returns its @id
      childrenAdded++;
    }

    // Nothing in list
    if (!childrenAdded && this.emptyWidget) {
      const emptyWidgetElement = document.createElement(this.emptyWidget);
      emptyWidgetElement.value = this.emptyValue;
      div.appendChild(emptyWidgetElement);
    }

    const nextProcessor = listPostProcessors.shift();
    if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
  }
}

export {
  ListMixin
}