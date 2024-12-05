import { Sib } from '../libs/Sib.ts';

import { AttributeBinderMixin } from '../mixins/attributeBinderMixin.ts';
import { ContextMixin } from '../mixins/contextMixin.ts';
import type { WidgetInterface } from '../mixins/interfaces.ts';
import { TraversalSearchMixin } from '../mixins/traversalSearchMixin.ts';
import { WidgetMixin } from '../mixins/widgetMixin.ts';
import { newWidgetFactory } from '../new-widgets/new-widget-factory.ts';

import { html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

export const SolidTraversalSearch = {
  name: 'solid-traversal-search',
  use: [WidgetMixin, AttributeBinderMixin, TraversalSearchMixin, ContextMixin],
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
      default: undefined,
    },
    classSubmitButton: {
      type: String,
      default: undefined,
    },
    noRender: {
      type: String,
      default: null,
      callback: function (value: boolean) {
        if (value === null) this.populate();
      },
    },
  },
  initialState: {
    error: '',
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
  getWidget(field: string, isSet = false): WidgetInterface {
    let tagName = '';

    // If auto-range-[field] exists, create range-[field] and sets its value
    // if (this.element.hasAttribute('auto-range-' + field) && !this.element.hasAttribute('range-' + field)) {
    //   const idField = `${this.rangeId}_${field}`;
    //   this.element.setAttribute('range-' + field, 'store://local.' + idField);
    //   this.populate();
    // }

    const widgetAttribute = this.element.getAttribute('widget-' + field);
    // Choose widget
    if (
      !widgetAttribute &&
      (this.element.hasAttribute('range-' + field) ||
        this.element.hasAttribute('enum-' + field))
    ) {
      tagName = 'solid-form-dropdown';
    } else {
      tagName =
        widgetAttribute ||
        (!isSet ? this.defaultWidget : this.defaultSetWidget);
    }
    // Create widget
    if (!customElements.get(tagName)) {
      // component does not exist
      if (tagName.startsWith('solid')) newWidgetFactory(tagName); // solid- -> create it
    }

    return this.widgetFromTagName(tagName);
  },
  getSubmitTemplate() {
    return html`
        <div class=${ifDefined(this.classSubmitButton)}>
          ${
            this.submitWidget === 'button'
              ? html`
            <button type="submit">${this.submitButton || ''}</button>
          `
              : html`
            <input type="submit" value=${ifDefined(this.submitButton || undefined)}>
          `
          }
        </div>
      `;
  },
  async attach(elm: any) {
    if (this.attachedElements.has(elm)) return;
    this.attachedElements.add(elm);
  },
  async detach(elm: any) {
    if (!this.attachedElements.has(elm)) return;
    this.attachedElements.delete(elm);
  },
  getResultsTemplate() {
    return html`
      <div class="results">
        ${this.results.map(
          (result: any) => html`
          <div class="result">
            <div class="result-title">${result.first_name}</div>
            <div class="result-description">${result.last_name}</div>
          </div>
        `,
        )}
      </div>
    `;
  },
  empty(): void {},
  async populate(): Promise<void> {
    console.log('Triggerring populate ??', this.results);
    if (this.submitButton == null) {
      this.element.addEventListener('input', () => this.inputChange());
    } else {
      this.element.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        this.inputChange();
      });
    }
    const fields = await this.getFields();
    const widgetTemplates = await Promise.all(
      fields.map((field: string) => {
        return this.createWidgetTemplate(field);
      }),
    );
    const template = html`
      <form>
          ${widgetTemplates}
          ${this.submitButton == null ? '' : this.getSubmitTemplate()}
      </form>
      ${this.results ? this.getResultsTemplate() : ''}
    `;

    render(template, this.element);
  },
};
Sib.register(SolidTraversalSearch);
