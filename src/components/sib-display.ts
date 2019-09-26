import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { ListMixin } from '../mixins/listMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { PaginateMixin } from '../mixins/paginateMixin.js';
import { FilterMixin } from '../mixins/filterMixin.js';
import { CounterMixin } from '../mixins/counterMixin.js';
import { SorterMixin } from '../mixins/sorterMixin.js';
import { GrouperMixin } from '../mixins/grouperMixin.js';
import { FederationMixin } from '../mixins/federationMixin.js';
import { HighlighterMixin } from '../mixins/highlighterMixin.js';

export const SibDisplay = {
  name: 'sib-display',
  use: [ WidgetMixin, ListMixin, StoreMixin, PaginateMixin, GrouperMixin, CounterMixin, HighlighterMixin, FilterMixin, SorterMixin, FederationMixin ],
  attributes: {
    defaultWidget: {
      type: String,
      default: 'sib-display-value'
    },
  },
  created(): void {
    window.addEventListener('navigate', ((event: CustomEvent) => {
      if (this.resource == null) return;
      if (event['detail'].resource == null) return;
      if (this.resource['@id'] == null) return;
      this.element.toggleAttribute(
        'active',
        this.resource['@id'] === event.detail.resource.id,

      );
    }) as EventListener);
  },
  get childTag(): string {
    return this.element.dataset.child || this.element.tagName;
  },
  get defaultMultipleWidget(): string {
    return 'sib-multiple';
  },
  get defaultSetWidget(): string {
    return 'sib-set-default';
  },
  // Here "even.target" points to the content of the widgets of the children of sib-display
  dispatchSelect(event: Event): void {
    if (event.target) {
      const target = event.target as Element;
      const resource = target.closest(this.childTag).component.resource;
      this.element.dispatchEvent(
        new CustomEvent('resourceSelect', { detail: { resource: resource } }),
      );
      if (this.next) {
        this.element.dispatchEvent(
          new CustomEvent('requestNavigation', {
            bubbles: true,
            detail: { route: this.next, resource: resource },
          }),
        );
      }
    }
  },
  appendChildElt(resourceId: string, parent: Element): void {
    const child = document.createElement(this.childTag);
    child.addEventListener('click', this.dispatchSelect.bind(this));
    if (this.fields != null) child.setAttribute('fields', this.fields);

    for (let attr of this.element.attributes) {
      //copy widget and value attributes
      if (
        attr.name.startsWith('value-') ||
        attr.name.startsWith('label-') ||
        attr.name.startsWith('widget-') ||
        attr.name.startsWith('class-') ||
        attr.name.startsWith('multiple-') ||
        attr.name.startsWith('editable-') ||
        attr.name.startsWith('action-') ||
        attr.name.startsWith('default-') ||
        attr.name == 'extra-context'
      )
        child.setAttribute(attr.name, attr.value);
      if (attr.name.startsWith('child-'))
        child.setAttribute(attr.name.replace(/^child-/, ''), attr.value);
    }
    child.dataset.src = resourceId; // set id after the extra-context is

    parent.appendChild(child);
  },
  async appendSingleElt(parent: HTMLElement): Promise<void> {
    for (let field of await this.getFields()) {
      parent.appendChild(await this.createWidget(field, parent));
    }
  }
};

Sib.register(SibDisplay);