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
import { NextMixin } from '../mixins/nextMixin.js';
import { spread } from '../libs/lit-helpers.js';

//@ts-ignore
import { html, render } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { ifDefined } from 'https://unpkg.com/lit-html/directives/if-defined?module';

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
    NextMixin,
  ],
  attributes: {
    defaultWidget: {
      type: String,
      default: 'solid-display-value',
    },
  },
  initialState: {
    activeSubscription: null,
    removeActiveSubscription: null,
  },
  created(): void {
    // Set route active at initialization
    const route = document.querySelector('solid-route[active]');
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
      this.goToNext(resource);
    }
  },

  /**
   * Returns template of a child element (resource)
   * @param resourceId
   * @param attributes
   */
  getChildTemplate(resourceId: string, attributes: object): void {
    let template = html`
      <solid-display
        data-src=${resourceId}
        @click=${this.dispatchSelect.bind(this)}
        fields=${ifDefined(this.fields)}
        ...=${spread(attributes)}
      ></solid-display>
    `
    return template;
  },

  /**
   * Creates and render the content of a single element (resource)
   * @param parent
   */
  async appendSingleElt(parent: HTMLElement): Promise<void> {
    const fields = await this.getFields();
    const template = html`
      ${fields.map((field: string) => this.createWidget(field))}
    `;
    render(template, parent);
  },

  /**
   * @override listMixin method to use litHtml
   *
   * Render resources from a container
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
    const attributes = this.getChildAttributes(); // get attributes of children only once
    const template = html`
      ${resources.map(r => r ? this.getChildTemplate(r['@id'], attributes) : null)}
    `; // and create a child template for each resource
    render(template, div);

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
   * Get attributes to dispatch to children from current element
   */
  getChildAttributes() {
    const attributes = {};
    for (let attr of this.element.attributes) {
      //copy widget and value attributes
      if (
        attr.name.startsWith('value-')       ||
        attr.name.startsWith('label-')       ||
        attr.name.startsWith('placeholder-') ||
        attr.name.startsWith('widget-')      ||
        attr.name.startsWith('class-')       ||
        attr.name.startsWith('multiple-')    ||
        attr.name.startsWith('editable-')    ||
        attr.name.startsWith('action-')      ||
        attr.name.startsWith('default-')     ||
        attr.name == 'extra-context'
      )
        attributes[attr.name] = attr.value;
      if (attr.name.startsWith('child-'))
        attributes[attr.name.replace(/^child-/, '')] = attr.value;
    }
    return attributes;
  }
};

Sib.register(SolidDisplay);
