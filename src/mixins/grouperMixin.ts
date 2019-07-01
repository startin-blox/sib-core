const grouperMixin = {
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
  renderGroupedElements(div: HTMLElement): void {
    let groups = {};

    this.resources.forEach((resource: object) => {
      let valueGroup = resource[this.groupBy];
      if (!groups[valueGroup]) groups[valueGroup] = { resources: [] }; // if no group yet, we create one...
      groups[valueGroup].resources.push(resource) // ...and push corresponding resource into it
    });

    Object.keys(groups).forEach(group => { // For each group, render it and its children inside
      const groupDiv = document.createElement(this.groupByWidget);
      div.appendChild(groupDiv);

      if (!groupDiv.querySelector('[data-content]') || !groupDiv.querySelector('[data-title]')) {
        throw new Error(`The group widgets must have one element with a data-title attribute, and one element with a data-content attribute to display datas.`);
      }

      groupDiv.querySelector('[data-title]').textContent = group;
      groups[group].resources.forEach((resource: object) =>
        this.appendChildElt(resource, groupDiv.querySelector('[data-content]'))
      )
    });
  }
}

export {
  grouperMixin
}