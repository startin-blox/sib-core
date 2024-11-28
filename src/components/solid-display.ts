import { Sib } from '../libs/Sib';
import { spread } from '../libs/lit-helpers';
import { CounterMixin } from '../mixins/counterMixin';
import { FederationMixin } from '../mixins/federationMixin';
import { FilterMixin } from '../mixins/filterMixin';
import { GrouperMixin } from '../mixins/grouperMixin';
import { HighlighterMixin } from '../mixins/highlighterMixin';
import { ListMixin } from '../mixins/listMixin';
import { NextMixin } from '../mixins/nextMixin';
import { PaginateMixin } from '../mixins/paginateMixin';
import { RequiredMixin } from '../mixins/requiredMixin';
import { SorterMixin } from '../mixins/sorterMixin';
import { StoreMixin } from '../mixins/storeMixin';
import { WidgetMixin } from '../mixins/widgetMixin';

import { html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { PostProcessorRegistry } from '../libs/PostProcessorRegistry';
import { trackRenderAsync } from '../logger';

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
    RequiredMixin,
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
    const route = document.querySelector('solid-route[active]') as any;
    if (!route) return;
    setTimeout(() => {
      if (route.resourceId === this.resourceId) this.addActiveCallback();
    });
  },
  detached(): void {
    if (this.activeSubscription) PubSub.unsubscribe(this.activeSubscription);
    if (this.removeActiveSubscription)
      PubSub.unsubscribe(this.removeActiveSubscription);
  },
  // Update subscription when id changes
  updateNavigateSubscription() {
    if (this.activeSubscription) PubSub.unsubscribe(this.activeSubscription);

    if (this.resourceId) {
      this.activeSubscription = PubSub.subscribe(
        `enterRoute.${this.resourceId}`,
        this.addActiveCallback.bind(this),
      );
    }
  },
  addActiveCallback() {
    this.element.setAttribute('active', '');
    this.removeActiveSubscription = PubSub.subscribe(
      'leaveRoute',
      this.removeActiveCallback.bind(this),
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
  dispatchSelect(event: Event, resourceId: string): void {
    const linkTarget = (event?.target as Element).closest('a');
    if (linkTarget?.hasAttribute('href')) return;
    const resource = { '@id': resourceId };
    this.element.dispatchEvent(
      new CustomEvent('resourceSelect', { detail: { resource: resource } }),
    );
    this.goToNext(resource);
  },

  enterKeydownAction(event, resourceId: string): void {
    if (event.keyCode === 13) {
      const resource = { '@id': resourceId };
      this.goToNext(resource);
    }
  },
  /**
   * Returns template of a child element (resource)
   * @param resourceId
   * @param attributes
   */
  getChildTemplate(resourceId: string, attributes: object) {
    const template = html`
      <solid-display
        data-src=${resourceId}
        @click=${(event: Event) => this.dispatchSelect(event, resourceId)}
        @keydown=${(event: Event) => this.enterKeydownAction(event, resourceId)}
        fields=${ifDefined(this.fields)}
        ...=${spread(attributes)}
      ></solid-display>
    `;
    return template;
  },

  /**
   * Creates and render the content of a single element (resource)
   * @param parent
   */
  async appendSingleElt(parent: HTMLElement): Promise<void> {
    const fields = await this.getFields();
    const widgetTemplates = await Promise.all(
      // generate all widget templates
      fields.map((field: string) => this.createWidgetTemplate(field)),
    );
    render(html`${widgetTemplates}`, parent);
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
  renderDOM: trackRenderAsync(async function (
    resources: object[],
    listPostProcessors: PostProcessorRegistry,
    div: HTMLElement,
    context: string,
  ) {
    const attributes = this.getChildAttributes(); // get attributes of children only once
    // and create a child template for each resource
    const template = html`${resources.map(r => (r ? this.getChildTemplate(r['@id'], attributes) : null))}`;
    render(template, div);

    const nextProcessor = listPostProcessors.shift();

    if (nextProcessor)
      await nextProcessor(resources, listPostProcessors, div, context);
  }, 'SolidDisplay:renderDom'),

  /**
   * Get attributes to dispatch to children from current element
   */
  getChildAttributes() {
    const attributes: { [key: string]: string } = {};
    for (const attr of this.element.attributes) {
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
        attr.name.startsWith('link-text-') ||
        attr.name.startsWith('target-src-') ||
        attr.name.startsWith('data-label-') ||
        attr.name === 'extra-context'
      )
        attributes[attr.name] = attr.value;
      if (attr.name.startsWith('child-'))
        attributes[attr.name.replace(/^child-/, '')] = attr.value;
      if (attr.name === 'next') {
        attributes.role = 'button';
        attributes.tabindex = '0';
      }
    }
    return attributes;
  },
};

Sib.register(SolidDisplay);
