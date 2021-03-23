import { Sib } from '../libs/Sib';
import { WidgetMixin } from '../mixins/widgetMixin';
import type { WidgetInterface } from '../mixins/interfaces';
import { newWidgetFactory } from '../new-widgets/new-widget-factory';

import { html, render } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';

export const SolidFormSearch = {
  name: 'solid-form-search',
  use: [WidgetMixin],
  attributes: {
    defaultWidget: {
      type: String,
      default: 'solid-form-label-text',
    },
    submitButton: {
      type: String,
      default: null,
    },
    submitWidget: {
      type: String,
      default: undefined
    },
    classSubmitButton: {
      type: String,
      default: null,
    },
    noRender: {
      type: String,
      default: null,
      callback: function (value: boolean) {
        if (value === null) this.populate()
      }
    },
  },
  initialState: {
    error: '',
  },
  created() {
    if (this.element.closest('[no-render]')) this.noRender = ''; // if embedded in no-render, apply no-render to himself
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
      const name = (widget.component || widget).name;
      if (name == null) return;
      let value = widget.component ? widget.component.getValue() : widget.value;
      try {
        value = JSON.parse(value);
      } catch {}
      value = {
        type: widget.component.type,
        list: !!widget.component.multiple,
        value: value,
      }
      values[name] = value;
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
  getSubmitTemplate() {
    return (this.submitWidget === 'button') ?
      html`
        ${this.classSubmitButton ? html`
          <div class=${this.classSubmitButton}>
            <button type="submit">${this.submitButton || ''}</button>
          </div>
        ` : html `
          <button type="submit">${this.submitButton || ''}</button>
        `}
      ` : html`
        ${this.classSubmitButton ? html`
          <div class=${this.classSubmitButton}>
            <input type="submit" value=${ifDefined(this.submitButton || undefined)}>
          </div>
        `: html`
          <input type="submit" value=${ifDefined(this.submitButton || undefined)}>
        `}
      `;
  },
  empty(): void {},
  async populate(): Promise<void> {
    if(this.submitButton == null) {
      this.element.addEventListener('input', () => this.inputChange());
      this.element.addEventListener('change', () => this.inputChange());
    } else {
      this.element.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        this.inputChange();
      });
    }
    const fields = await this.getFields();
    const widgetTemplates = await Promise.all(fields.map((field: string) => this.createWidgetTemplate(field)));
    const template = html`
      <form>
        ${widgetTemplates}
        ${this.submitButton == null ? '' : this.getSubmitTemplate()}
      </form>
    `;
    render(template, this.element);
  }
};

Sib.register(SolidFormSearch);