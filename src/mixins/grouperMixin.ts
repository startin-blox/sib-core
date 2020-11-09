const GrouperMixin = {
  name: 'grouper-mixin',
  use: [],
  attributes: {
    groupBy: {
      type: String,
      default: null
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

      // Render group parents and call next processor
      for (let group of Object.keys(groups)) {
        const parent = await this.renderGroup(group, div);
        if (nextProcessor) await nextProcessor(groups[group].resources, [...listPostProcessors], parent, context+"_"+group);
      }
    } else {
      if(nextProcessor) await nextProcessor(resources, listPostProcessors, div, context);
    }
  },
  async renderGroup(groupName: string, div: HTMLElement) {
    const groupElt = document.createElement(this.groupWidget);
    groupElt.setAttribute('value', groupName);
    if (this.groupClass) groupElt.setAttribute('class', this.groupClass);
    div.appendChild(groupElt);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(groupElt.querySelector('[data-content]'))
      })
    });
  }
}

export {
  GrouperMixin
}