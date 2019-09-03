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
    for await (const resource of this.resource['ldp:contains']) {
      //if source, add to array
      resources.push({ // TODO : refactor
        "@id": resource.toString(),
        name: (await resource.name).toString(),
        email: (await resource.email).toString(),
        // comingsoon: (await resource.comingsoon).toString(),
        // type: "sib:source", //(await resource['@type']).toString()
        // container: (await resource.container).toString()
      })
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
    this.listPostProcessors.push(this.renderDOM.bind(this));

    // Execute the first post-processor of the list
    this.listPostProcessors[0](resources, this.listPostProcessors, div, 1);
  },

  renderDOM(resources: object[], listPostProcessors: Function[], div: HTMLElement, nextToExecute: number) {
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
    this.listPostProcessors.pop(); // remove renderDOM from array
  }
}

export {
  ListMixin
}