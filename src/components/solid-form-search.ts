import { Sib } from '../libs/Sib';
import { WidgetMixin } from '../mixins/widgetMixin';
import { setDeepProperty } from '../libs/helpers';
import type { WidgetInterface } from '../mixins/interfaces';
import { newWidgetFactory } from '../new-widgets/new-widget-factory';

import { html, render } from 'lit-html';

export const SolidFormSearch = {
  name: 'solid-form-search',
  use: [WidgetMixin],
  attributes: {
    defaultWidget: {
      type: String,
      default: 'solid-form-label-text',
    },
    async: {
      type: Boolean,
      default: false,
    }
  },
  initialState: {
    error: '',
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
    if (!widgetAttribute && (this.element.hasAttribute('range-' + field) || this.element.hasAttribute('enum-' + field))) {
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
    console.log(this.async, 'aaa');
    
    if(!this.async)
      this.element.addEventListener('input', () => this.inputChange());
    else
      this.element.addEventListener('submit', (e: Event) => {e.preventDefault(), this.inputChange()});
    const fields = await this.getFields();
    const template = html`
      <form>
        ${fields.map((field: string) => this.createWidget(field))}
        ${this.async
            ? html`<input type="submit" />` : ''}
      </form>
    `;
    render(template, this.element);
  }
};

Sib.register(SolidFormSearch);