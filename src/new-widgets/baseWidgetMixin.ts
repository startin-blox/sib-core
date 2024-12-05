import type PubSubType from 'pubsub-js';
import { PostProcessorRegistry } from '../libs/PostProcessorRegistry.ts';
import type { Template } from './interfaces.ts';

import { render } from 'lit';

declare const PubSub: typeof PubSubType;

const BaseWidgetMixin = {
  name: 'widget-mixin',
  use: [],
  attributes: {
    value: {
      type: String,
      default: '',
      callback: function () {
        this.planRender();
      },
    },
    name: {
      type: String,
      default: '',
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'name');
      },
    },
    label: {
      type: String,
      default: null,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'label');
      },
    },
    autoSubscribe: {
      type: String,
      default: null,
      callback: function (newValue: string) {
        if (this.subscription) PubSub.unsubscribe(this.subscription);
        this.subscribe(newValue);
      },
    },
  },
  initialState: {
    listValueTransformations: new PostProcessorRegistry(),
    listTemplateAdditions: new PostProcessorRegistry(),
    listAttributes: {},
    listCallbacks: new PostProcessorRegistry(),
    renderPlanned: false,
  },
  get template() {
    return null;
  },
  created() {
    this.listValueTransformations = new PostProcessorRegistry();
    this.listAttributes = {};
    this.listTemplateAdditions = new PostProcessorRegistry();
    this.listCallbacks = new PostProcessorRegistry();
    this.subscription = null;
  },
  attached() {
    this.planRender();
  },
  detached() {
    if (this.subscription) PubSub.unsubscribe(this.subscription);
  },
  planRender() {
    if (!this.renderPlanned && document.body.contains(this.element)) {
      this.renderPlanned = true;
      setTimeout(() => {
        this.render();
        this.renderPlanned = false;
      });
    }
  },
  render() {
    const listValueTransformationsCopy =
      this.listValueTransformations.deepCopy();
    listValueTransformationsCopy.attach(
      this.renderTemplate.bind(this),
      'BaseWidgetMixin:renderTemplate',
    );
    const nextProcessor = listValueTransformationsCopy.shift();
    nextProcessor(this.value, listValueTransformationsCopy);

    // Callbacks
    const listCallbacksCopy = this.listCallbacks.deepCopy();
    const nextCallback = listCallbacksCopy.shift();
    if (nextCallback) {
      nextCallback(this.value, listCallbacksCopy);
    }

    this.element.dispatchEvent(
      new CustomEvent('widgetRendered', { bubbles: true }),
    );
  },
  renderTemplate(value: string) {
    const template: Template = this.template(value, { ...this.listAttributes });
    const listTemplateAdditionsCopy = this.listTemplateAdditions.deepCopy();
    listTemplateAdditionsCopy.attach(
      this.templateToDOM.bind(this),
      'BaseWidgetMixin:templateToDOM',
    );

    const nextProcessor = listTemplateAdditionsCopy.shift();
    nextProcessor(template, listTemplateAdditionsCopy);
  },
  templateToDOM(template: Template) {
    render(template, this.element);
  },
  addToAttributes(value: string, attrKey: string) {
    if (value !== null && value !== this.listAttributes[attrKey]) {
      this.listAttributes[attrKey] = value;
      this.planRender();
    }
  },
  subscribe(event: string) {
    this.subscription = PubSub.subscribe(event, () => this.planRender());
  },
  update() {
    this.planRender();
  },
};

export { BaseWidgetMixin };
