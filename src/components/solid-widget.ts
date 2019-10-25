import { Sib } from '../libs/Sib.js';
import { widgetFactory } from '../widgets/widget-factory.js';

export const SolidWidget = {
  name: 'solid-widget',
  use: [],
  attributes: {
    name: {
      type: String,
      default: "",
      required: true
    }
  },
  attached(): void {
    widgetFactory(this.name, this.template, this.childTemplate);
  },
  get template(): string {
    return this.element.querySelector('template:not([data-range])').innerHTML;
  },
  get childTemplate(): string | null {
    const child = this.element.querySelector('template[data-range]');
    return child ? child.innerHTML : null;
  }
};

Sib.register(SolidWidget);