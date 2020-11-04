const ListMixin = {
  name: 'list-mixin',
  use: [],
  attributes: {
    emptyWidget: {
      type: String,
      default: null,
    },
    emptyValue: {
      type: String,
      default: '',
    },
  },
  initialState: {
    listPostProcessors: [],
  },
  created() {
    this.listPostProcessors = [];
  },
  appendSingleElt(parent: HTMLElement): void {
    this.appendChildElt(this.resource['@id'], parent);
  },
  async populate(): Promise<void> {
    const div = this.div;
    if (!this.resource) return;

    // Not a container but a single resource
    if (!this.resource.isContainer()) {
      this.element.removeAttribute("solid-container");
      this.element.setAttribute("solid-resource", "");
      this.appendSingleElt(div);
      return;
    }
    this.element.removeAttribute("solid-resource");
    this.element.setAttribute("solid-container", "")
    const listPostProcessors = [...this.listPostProcessors];
    listPostProcessors.push(this.renderDOM.bind(this));
    listPostProcessors.push(this.handleEmptyWidget.bind(this));

    // Execute the first post-processor of the list
    const nextProcessor = listPostProcessors.shift();
    await nextProcessor(
      this.resource['ldp:contains'],
      listPostProcessors,
      div,
      this.dataSrc,
    );
  },

  /**
   * Render resources in the DOM
   * @param resources
   * @param listPostProcessors
   * @param div
   * @param context
   */
  async renderDOM(
    resources: object[],
    listPostProcessors: Function[],
    div: HTMLElement,
    context: string,
  ) {
    // Create child components
    for (let resource of resources) {
      if (!resource) continue;
      this.appendChildElt(resource['@id'], div);
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(
        resources,
        listPostProcessors,
        div,
        context
      );
  },

  /**
   * Show empty widget if no resources in the list
   * @param resources
   * @param listPostProcessors
   * @param div
   * @param context
   */
  async handleEmptyWidget(
    resources: object[],
    listPostProcessors: Function[],
    div: HTMLElement,
    context: string,
  ) {
    if (resources.length === 0 && this.emptyWidget) {
      const emptyWidgetElement = document.createElement(this.emptyWidget);
      emptyWidgetElement.value = this.emptyValue;
      div.appendChild(emptyWidgetElement);
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(
        resources,
        listPostProcessors,
        div,
        context
      );
  },
};

export { ListMixin };
