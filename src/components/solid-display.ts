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

export const SolidDisplay = {
  name: 'solid-display',
  use: [
    WidgetMixin,
    ListMixin,
    StoreMixin,
    PaginateMixin,
    GrouperMixin,
    CounterMixin,
    HighlighterMixin,
    FilterMixin,
    SorterMixin,
    FederationMixin,
  ],
  attributes: {
    defaultWidget: {
      type: String,
      default: 'solid-text',
    },
  },
  initialState: {
    activeSubscription: null,
    removeActiveSubscription: null,
  },
  created(): void {
    // Set route active at initialization
    const route = document.querySelector('solid-route[active], sib-route[active]');
    if (!route) return;
    setTimeout(() => {
      if (route['resourceId'] === this.resourceId) this.addActiveCallback();
    });
  },
  // Update subscription when id changes
  updateNavigateSubscription() {
    if (this.activeSubscription) PubSub.unsubscribe(this.activeSubscription);

    if (this.resourceId) {
      this.activeSubscription = PubSub.subscribe(
        'enterRoute.' + this.resourceId,
        this.addActiveCallback.bind(this)
      );
    }
  },
  addActiveCallback() {
    this.element.setAttribute('active', '');
    this.removeActiveSubscription = PubSub.subscribe(
      'leaveRoute',
      this.removeActiveCallback.bind(this)
    );
  },
  removeActiveCallback() {
    this.element.removeAttribute('active');
    PubSub.unsubscribe(this.removeActiveSubscription);
  },
  get childTag(): string {
    return this.element.dataset.child || this.element.tagName;
  },
  get defaultMultipleWidget(): string {
    return 'solid-multiple';
  },
  get defaultSetWidget(): string {
    return 'solid-set-default';
  },
  // Here "even.target" points to the content of the widgets of the children of solid-display
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
        attr.name.startsWith('placeholder-') ||
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
    for (const field of await this.getFields()) {
      parent.appendChild(this.createWidget(field));
    }
  },
};

Sib.register(SolidDisplay);
