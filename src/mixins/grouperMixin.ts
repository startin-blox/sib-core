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
        let valueGroup = (await resource[this.groupBy]).toString();
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
    const groupDiv = document.createElement(this.groupByWidget);
    div.appendChild(groupDiv);

    if (!groupDiv.querySelector('[data-content]') || !groupDiv.querySelector('[data-title]')) {
      throw new Error(`The group widgets must have one element with a data-title attribute, and one element with a data-content attribute to display datas.`);
    }

    groupDiv.querySelector('[data-title]').textContent = groupName;
    return groupDiv.querySelector('[data-content]');
  }
}

export {
  GrouperMixin
}