//@ts-ignore
import {render} from 'https://unpkg.com/lit-html?module';

const WidgetMixin = {
  name: 'widget-mixin',
  use: [],
  attributes: {
    value: {
      type: String,
      default: null,
      callback: function () {
        this.render();
      }
    },
    name: {
      type: String,
      default: "",
      callback: function () {
        this.render();
      }
    }
  },
  initialState: {
    listValueTransformations: [],
  },
  get template() {
    return null
  },
  created() {
    this.listValueTransformations = [];
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
  WidgetMixin
}