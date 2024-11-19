import type { PostProcessorRegistry } from '../libs/PostProcessorRegistry';
import { generalComparator } from '../libs/helpers';

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
      default: 'solid-group-default',
    },
    groupClass: {
      type: String,
      default: '',
    },
    orderGroupAsc: {
      type: Boolean,
      default: null,
    },
    orderGroupDesc: {
      type: Boolean,
      default: null,
    },
  },
  attached() {
    this.listPostProcessors.attach(
      this.groupResources.bind(this),
      'GrouperMixin:groupResources',
    );
  },
  async groupResources(
    resources: object[],
    listPostProcessors: PostProcessorRegistry,
    div: HTMLElement,
    context: string,
  ) {
    const nextProcessor = listPostProcessors.shift();
    if (this.groupBy) {
      const groups = {};
      for (const resource of resources) {
        const valueGroup = await resource[this.groupBy];
        if (valueGroup == null) continue;
        if (!groups[valueGroup]) groups[valueGroup] = { resources: [] }; // if no group yet, we create one...
        groups[valueGroup].resources.push(resource); // ...and push corresponding resource into it
      }

      let sortedKeys = Object.keys(groups);
      if (this.orderGroupAsc !== null || this.orderGroupDesc !== null) {
        const order = this.orderGroupDesc !== null ? 'desc' : 'asc';
        sortedKeys = Object.keys(groups).sort((a, b) => {
          return generalComparator(a, b, order);
        });
      }

      // For each group, get group widget and call next processors
      const parents = sortedKeys.map(g => ({
        group: g,
        parent: this.renderGroup(g, div),
      }));
      for (const { group, parent } of parents) {
        if (nextProcessor)
          await nextProcessor(
            groups[group].resources, // give only resources from group
            listPostProcessors.deepCopy(), // copy post processors
            parent, // parent is group widget
            context + '_' + group,
          );
      }
    } else {
      if (nextProcessor)
        await nextProcessor(resources, listPostProcessors, div, context);
    }
  },
  /**
   * Create a group widget or find if it already exists
   * @param groupName
   */
  renderGroup(groupName: string, div: HTMLElement) {
    let groupElt = this.element.querySelector(
      `${this.groupWidget}[value="${groupName}"]`,
    );
    if (!groupElt) {
      groupElt = document.createElement(this.groupWidget);
      groupElt.setAttribute('value', groupName);
      if (this.groupClass) groupElt.setAttribute('class', this.groupClass);
      if (groupElt.component) groupElt.component.render(); // Force the rendering of the widget
      div.appendChild(groupElt); // and append it to the parent div
    }
    return groupElt.querySelector('[data-content]') || groupElt; // return the node where to insert content
  },
};

export { GrouperMixin };
