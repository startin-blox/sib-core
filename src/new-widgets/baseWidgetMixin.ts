import { Template } from './interfaces.js';

//@ts-ignore
import {render} from 'https://unpkg.com/lit-html?module';

const BaseWidgetMixin = {
  name: 'widget-mixin',
  use: [],
  attributes: {
    value: {
      type: String,
      default: null,
      callback: function () {
        this.planRender();
      }
    },
    name: {
      type: String,
      default: "",
      callback: function () {
        this.planRender();
      }
    },
  },
  initialState: {
    listValueTransformations: [],
    listTemplateAdditions: [],
    listAttributes: {},
    listCallbacks: [],
    renderPlanned: false,
  },
  get template() {
    return null
  },
  created() {
    this.listValueTransformations = [];
    this.listAttributes = {};
    this.listTemplateAdditions = [];
    this.listCallbacks = [];
  },
  planRender() {
    if (!this.renderPlanned) {
      this.renderPlanned = true;
      setTimeout(() => {
        this.render();
        this.renderPlanned = false;
      });
    }
  },
  render() {
    const listValueTransformations = [...this.listValueTransformations];
    listValueTransformations.push(this.renderTemplate.bind(this));

    const nextProcessor = listValueTransformations.shift();
    nextProcessor(this.value, listValueTransformations);

    // Callbacks
    const listCallbacks = [...this.listCallbacks];
    if (listCallbacks.length) {
      const nextCallback = listCallbacks.shift();
      nextCallback(this.value, listCallbacks);
    }
  },
  renderTemplate(value: string) {
    const template: Template = this.template(value, {
      ...this.listAttributes,
      name: this.name
    });
    const listTemplateAdditions = [...this.listTemplateAdditions];
    listTemplateAdditions.push(this.templateToDOM.bind(this));

    const nextProcessor = listTemplateAdditions.shift();
    nextProcessor(template, listTemplateAdditions);
  },
  templateToDOM(template: Template) {
    render(template, this.element);
  }
}

export {
  BaseWidgetMixin
}