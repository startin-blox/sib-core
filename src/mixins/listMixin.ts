import { html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { PostProcessorRegistry } from '../libs/PostProcessorRegistry';
import { preHTML } from '../libs/lit-helpers';

const ListMixin = {
  name: 'list-mixin',
  use: [],
  attributes: {
    emptyWidget: {
      type: String,
      default: null,
    },
    emptyValue: {
      type: String,
      default: '',
    },
  },
  initialState: {
    // Processors functions to execute on the list before rendering
    listPostProcessors: new PostProcessorRegistry(),
    // Rendering to execute after all the processors have been executed
    renderCallbacks: [],
  },
  created() {
    this.listPostProcessors = new PostProcessorRegistry();
    this.renderCallbacks = [];
  },
  appendSingleElt(parent: HTMLElement): void {
    this.appendChildElt(this.resource['@id'], parent);
  },
  setElementAttribute(attr: 'resource' | 'container') {
    const containerAttribute = 'solid-container';
    const resourceAttribute = 'solid-resource';
    if (attr === 'resource') {
      this.element.removeAttribute(containerAttribute);
      this.element.setAttribute(resourceAttribute, '');
    } else {
      this.element.removeAttribute(resourceAttribute);
      this.element.setAttribute(containerAttribute, '');
    }
  },
  async populate(): Promise<void> {
    const listPostProcessorsCopy = this.listPostProcessors.deepCopy();
    const div = this.div;
    if (!this.resource) return;

    // Not a container but a single resource
    if (
      !this.resource.isContainer?.() &&
      !this.arrayField &&
      !this.predicateName
    ) {
      this.setElementAttribute('resource');
      this.appendSingleElt(div);
      return;
    }

    if (this.resource.isContainer?.()) {
      this.setElementAttribute('container');
      this.renderCallbacks = [];
      listPostProcessorsCopy.attach(
        this.renderDOM.bind(this),
        'ListMixin:renderDOM',
      );
      listPostProcessorsCopy.attach(
        this.handleEmptyWidget.bind(this),
        'ListMixin:handleEmptyWidget',
      );

      // Execute the first post-processor of the list
      const nextProcessor = listPostProcessorsCopy.shift();

      await nextProcessor(
        this.resource['ldp:contains'],
        listPostProcessorsCopy,
        div,
        this.dataSrc,
      );
    } else if (
      this.arrayField &&
      this.predicateName &&
      this.resource[this.predicateName]
    ) {
      this.setElementAttribute('container');
      this.renderCallbacks = [];
      listPostProcessorsCopy.attach(
        this.renderDOM.bind(this),
        'ListMixin:renderDOM',
      );
      listPostProcessorsCopy.attach(
        this.handleEmptyWidget.bind(this),
        'ListMixin:handleEmptyWidget',
      );

      // Execute the first post-processor of the list
      const nextProcessor = listPostProcessorsCopy.shift();

      await nextProcessor(
        await this.resource[this.predicateName],
        listPostProcessorsCopy,
        div,
        this.dataSrc,
      );
    }
    // Execute the render callbacks
    for (const renderCallback of this.renderCallbacks) {
      // Render the template in the given parent element
      render(renderCallback.template, renderCallback.parent);
    }
  },

  /**
   * Render resources in the DOM
   * @param resources
   * @param listPostProcessors
   * @param div
   * @param context
   */
  async renderDOM(
    resources: object[],
    listPostProcessors: PostProcessorRegistry,
    div: HTMLElement,
    context: string,
  ) {
    // Create child components
    for (const resource of resources) {
      if (!resource) continue;
      this.appendChildElt(resource['@id'], div);
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(resources, listPostProcessors, div, context);
  },

  /**
   * Show empty widget if no resources in the list
   * @param resources
   * @param listPostProcessors
   * @param div
   * @param context
   */
  async handleEmptyWidget(
    resources: object[],
    listPostProcessors: PostProcessorRegistry,
    div: HTMLElement,
    context: string,
  ) {
    if (this.emptyWidget) {
      const emptyWidgetTemplate = preHTML`<${this.emptyWidget} value=${ifDefined(this.emptyValue)}></${this.emptyWidget}>`;
      if (!this.emptyWrapper) {
        this.emptyWrapper = document.createElement('span');
        this.element.appendChild(this.emptyWrapper);
      }

      render(
        resources.length > 0 ? html`` : emptyWidgetTemplate,
        this.emptyWrapper,
      );
    }

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(resources, listPostProcessors, div, context);
  },
};

export { ListMixin };
