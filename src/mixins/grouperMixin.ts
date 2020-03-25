const GrouperMixin = {
  name: 'grouper-mixin',
  use: [],
  attributes: {
    groupBy: {
      type: String,
      default: null
    },
    groupByWidget: {
      type: String,
      default: 'sib-group-div'
    }
  },
  attached() {
    this.listPostProcessors.push(this.groupResources.bind(this));
  },
  async groupResources(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    const nextProcessor = listPostProcessors.shift();
    if (this.groupBy) {
      let groups = {};
      for await (let resource of resources) {
        const valueGroup = await resource[this.groupBy];
        if (!valueGroup) continue;
        if (!groups[valueGroup]) groups[valueGroup] = { resources: [] }; // if no group yet, we create one...
        groups[valueGroup].resources.push(resource) // ...and push corresponding resource into it
      }

      // Render group parents and call next processor
      for (let group of Object.keys(groups)) {
        const parent = this.renderGroup(group, div);
        if (nextProcessor) await nextProcessor(groups[group].resources, [...listPostProcessors], parent, context+"_"+group);
      }
    } else {
      if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
    }
  },
  renderGroup(groupName: string, div: HTMLElement) {
    // TODO: make it work with widgets
    const groupElement = document.createElement("div");
    const titleElement = document.createElement("span");
    const contentElement = document.createElement("div");
    titleElement.toggleAttribute('data-title');
    contentElement.toggleAttribute('data-content');

    groupElement.appendChild(titleElement);
    groupElement.appendChild(contentElement);
    div.appendChild(groupElement);

    titleElement.textContent = groupName;
    return contentElement;
  }
}

export {
  GrouperMixin
}