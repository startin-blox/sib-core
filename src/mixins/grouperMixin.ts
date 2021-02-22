const GrouperMixin = {
  name: 'grouper-mixin',
  use: [],
  attributes: {
    groupBy: {
      type: String,
      default: null,
    },
    groupWidget: {
      type: String,
      default: 'solid-group-default'
    },
    groupClass: {
      type: String,
      default: ''
    }
  },
  attached() {
    this.listPostProcessors.push(this.groupResources.bind(this));
  },
  async groupResources(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string) {
    const nextProcessor = listPostProcessors.shift();
    if (this.groupBy) {
      let groups = {};
      for (let resource of resources) {
        const valueGroup = await resource[this.groupBy];
        if (valueGroup == null) continue;
        if (!groups[valueGroup]) groups[valueGroup] = { resources: [] }; // if no group yet, we create one...
        groups[valueGroup].resources.push(resource) // ...and push corresponding resource into it
      }

      // For each group, get group widget and call next processors
      const parents = Object.keys(groups).map(g => ({ group: g, parent: this.renderGroup(g, div) }));
      for (let { group, parent } of parents) {
        if (nextProcessor) await nextProcessor(
          groups[group].resources, // give only resources from group
          [...listPostProcessors], // copy post processors
          parent, // parent is group widget
          context + "_" + group
        );
      }
    } else {
      if (nextProcessor) await nextProcessor(
        resources,
        listPostProcessors,
        div,
        context
      );
    }
  },
  /**
   * Create a group widget or find if it already exists
   * @param groupName
   */
  renderGroup(groupName: string, div: HTMLElement) {
    let groupElt = this.element.querySelector(`${this.groupWidget}[value="${groupName}"]`);
    if (!groupElt) {
      groupElt = document.createElement(this.groupWidget);
      groupElt.setAttribute('value', groupName);
      if (this.groupClass) groupElt.setAttribute('class', this.groupClass);
      if (groupElt.component) groupElt.component.render();
      div.appendChild(groupElt);
    }
    return groupElt.querySelector('[data-content]') || groupElt;
  }
}

export {
  GrouperMixin
}