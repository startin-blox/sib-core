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
    renderPlanned: false,
  },
  get template() {
    return null
  },
  created() {
    this.listValueTransformations = [];
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
    listValueTransformations.push(this.templateToDOM.bind(this));

    // Execute the first post-processor of the list
    const nextProcessor = listValueTransformations.shift();
    nextProcessor(this.value, listValueTransformations);
  },
  templateToDOM(value) {
    render(this.template(value, this.name), this.element);
  }
}

export {
  BaseWidgetMixin
}