import { evalTemplateString } from '../libs/helpers.js';

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
    return evalTemplateString(this.template, {
      value,
      name: this.name
    }).then(res => this.element.innerHTML = res);
  }
}

export {
  WidgetMixin
}