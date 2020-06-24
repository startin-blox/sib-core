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
    listDomAdditions: [],
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
    this.listDomAdditions = [];
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
  renderTemplate(value) {
    const template = this.template(value, {
      ...this.listAttributes,
      name: this.name
    });
    const listDomAdditions = [...this.listDomAdditions];
    listDomAdditions.push(() => this.templateToDOM(template));

    const nextProcessor = listDomAdditions.shift();
    nextProcessor(template, listDomAdditions);
  },
  templateToDOM(template) {
    render(template, this.element);
  }
}

export {
  BaseWidgetMixin
}