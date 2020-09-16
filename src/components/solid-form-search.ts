import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { setDeepProperty } from '../libs/helpers.js';
import type { WidgetInterface } from '../mixins/interfaces.js';
import { newWidgetFactory } from '../new-widgets/new-widget-factory.js';

import { html, render } from 'lit-html';

export const SolidFormSearch = {
  name: 'solid-form-search',
  use: [WidgetMixin],
  attributes: {
    defaultWidget: {
      type: String,
      default: 'solid-form-label-text'
    },
  },
  initialState: {
    error: ''
  },
  get defaultMultipleWidget(): string {
    return 'solid-multiple-form';
  },
  get defaultSetWidget(): string {
    return 'solid-set-default';
  },
  get value(): object {
    const values = {};
    this.widgets.forEach((widget) => {
      let value = widget.component.getValue(); // TODO : possible to do .value instead?
      try {
        value = JSON.parse(value);
      } catch (e) {}
      setDeepProperty(values, widget.component.name.split('.'), value);
    });

    return values;
  },
  getWidget(field: string, isSet: boolean = false): WidgetInterface {
    let tagName = '';
    const widgetAttribute = this.element.getAttribute('widget-' + field);

    // Choose widget
    if (!widgetAttribute && this.element.hasAttribute('range-' + field)) {
      tagName = 'solid-form-dropdown'
    } else {
      tagName = widgetAttribute || (!isSet ? this.defaultWidget : this.defaultSetWidget);
    }
    // Create widget
    if (!customElements.get(tagName)) { // component does not exist
      if (tagName.startsWith('solid')) newWidgetFactory(tagName); // solid- -> create it
    }

    return this.widgetFromTagName(tagName);
    
  },
  change(resource: object): void {
    this.element.dispatchEvent(
      new CustomEvent('formChange', {
        bubbles: true,
        detail: { resource },
      }),
    );
  },
  async inputChange(): Promise<void> {
    this.change(this.value);
  },
  empty(): void {
  },
  
  async populate(): Promise<void> {
    this.element.addEventListener('input', (event: Event) => this.inputChange(event));
    const fields = await this.getFields();
    const template = html`
      <form>
        ${fields.map((field: string) => this.createWidget(field))}
      </form>
    `;
    render(template, this.element);
  }
};

Sib.register(SolidFormSearch);