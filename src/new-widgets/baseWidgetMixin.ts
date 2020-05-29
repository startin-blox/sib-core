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
    }
  },
  initialState: {
    listValueTransformations: [],
    listDomAdditions: [],
    renderPlanned: false,
  },
  get template() {
    return null
  },
  created() {
    this.listValueTransformations = [];
    this.listDomAdditions = [];
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
    listValueTransformations.push(this.domAdditions.bind(this));

    const nextProcessor = listValueTransformations.shift();
    nextProcessor(this.value, listValueTransformations);
  },
  domAdditions(value) {
    const template = this.template(value, this.name);
    const listDomAdditions = [...this.listDomAdditions];
    listDomAdditions.push(this.templateToDOM.bind(this));

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