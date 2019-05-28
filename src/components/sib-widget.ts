import { Sib } from '../libs/Sib.js';
import { widgetFactory } from '../widgets/widget-factory.js';

export const SibWidget = {
  name: 'sib-widget',
  use: [],
  attributes: {
    name: {
      type: String,
      default: "",
      required: true
    }
  },
  initialState: {

  },
  attached() {
    widgetFactory(this.name, this.template, this.childTemplate);
  },
  get template() {
    return this.element.querySelector('template:not([data-range])').innerHTML;
  },
  get childTemplate() {
    const child = this.element.querySelector('template[data-range]');
    return child ? child.innerHTML : null;
  }
};

Sib.register(SibWidget);