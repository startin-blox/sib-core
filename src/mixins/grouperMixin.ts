const grouperMixin = {
  name: 'grouper-mixin',
  use: [],
  attributes: {
    groupBy: {
      type: String,
      default: null
    },
  },
  renderGroupedElements(div: HTMLElement) {
    let groups = {};

    this.resources.forEach(resource => {
      let valueGroup = resource[this.groupBy];
      if (!groups[valueGroup]) groups[valueGroup] = { resources: [] }; // if no group yet, we create one...
      groups[valueGroup].resources.push(resource) // ...and push corresponding resource into it
    });

    Object.keys(groups).forEach(group => { // For each group, render it and its children inside
      const groupDiv = document.createElement('div');
      const groupDivTitle = document.createElement('span');
      groupDivTitle.textContent = group;

      div.appendChild(groupDiv);
      groupDiv.appendChild(groupDivTitle);
      groups[group].resources.forEach(resource => this.appendChildElt(resource, groupDiv))
    });
  }
}

export {
  grouperMixin
}