import { Sib } from '../libs/Sib';
import { WidgetMixin } from '../mixins/widgetMixin';
import { AttributeBinderMixin } from '../mixins/attributeBinderMixin';
import { ContextMixin } from '../mixins/contextMixin';
import type { WidgetInterface } from '../mixins/interfaces';
import { newWidgetFactory } from '../new-widgets/new-widget-factory';

import { html, render } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';
import { uniqID } from '../libs/helpers';
import type { SearchQuery, FilterEventOptions } from '../libs/interfaces';

export const SolidFormSearch = {
  name: 'solid-form-search',
  use: [WidgetMixin, AttributeBinderMixin, ContextMixin],
  debounceTimeout: undefined as (number | undefined),
  attributes: {
    defaultWidget: {
      type: String,
      default: 'solid-form-label-text',
    },
    submitButton: {
      type: String,
      default: null,
      callback: function (newValue: string, oldValue: string) {
        if (this.noRender == null && newValue !== oldValue) this.populate();
      },
    },
    submitWidget: {
      type: String,
      default: undefined
    },
    classSubmitButton: {
      type: String,
      default: undefined,
    },
    noRender: {
      type: String,
      default: null,
      callback: function (value: boolean) {
        if (value === null) this.populate()
      }
    },
    debounce: {
      type: Number,
      default: 0 // Avoiding blink effect with static values
    }
  },
  initialState: {
    error: '',
  },
  created() {
    if (this.element.closest('[no-render]')) this.noRender = ''; // if embedded in no-render, apply no-render to himself
    this.autoRangeValues = {};
    this.rangeId = uniqID();
    this.attachedElements = new Set();
  },
  get defaultMultipleWidget(): string {
    return 'solid-multiple-form';
  },
  get defaultSetWidget(): string {
    return 'solid-set-default';
  },
  get value(): SearchQuery {
    const values: SearchQuery = {};
    this.widgets.forEach((widget) => {
      if (widget == null) return;
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
    // If auto-range-[field] exists, create range-[field] and sets its value
    if(this.element.hasAttribute('auto-range-' + field) && !this.element.hasAttribute('range-' + field)) {
      const idField = `${this.rangeId}_${field}`;
      this.element.setAttribute('range-' + field, 'store://local.' + idField);
      this.populate();
    }
    
    const widgetAttribute = this.element.getAttribute('widget-' + field);
    // Choose widget
    if (!widgetAttribute && (this.element.hasAttribute('range-' + field) || this.element.hasAttribute('enum-' + field))) {
      tagName = 'solid-form-dropdown'
    } else {
      tagName = widgetAttribute || (!isSet ? this.defaultWidget : this.defaultSetWidget);
    }
    // Create widget
    if (!customElements.get(tagName)) { // component does not exist
      if (tagName.startsWith('solid')) newWidgetFactory(tagName); // solid- -> create it
    }

    return this.widgetFromTagName(tagName);
  },
  async attach(elm: any) {
    if(this.attachedElements.has(elm)) return;
    this.attachedElements.add(elm);
    await this.updateAutoRanges();
  },
  async detach(elm: any) {
    if(!this.attachedElements.has(elm)) return;
    this.attachedElements.delete(elm);
    await this.updateAutoRanges();
  },
  async updateAutoRanges() {
    for(const attr of (this.element as Element).attributes) {
      if (!attr['name'].startsWith('auto-range-')) continue;
      let fieldName = attr.value !== '' ? attr.value : attr['name'].replace('auto-range-', '');
      const autoRangeValues = new Set();
      for(const elm of this.attachedElements) {
        for(const value of await elm.getValuesOfField(fieldName)) {
          autoRangeValues.add(value);
        }
      }

      const idField = `${this.rangeId}_${fieldName}`;
      const id = `store://local.${idField}`;
      const ldpContains = Array.from(autoRangeValues).map(id => ({'@id' : id}));
      const data = {
        "@type": "ldp:Container",
        "@context": this.context,
        "ldp:contains" : ldpContains,
      };
      // @ts-ignore
      sibStore.setLocalData(data, id);
    }
  },
  change(resource: object, eventOptions: FilterEventOptions): void {
    if (!resource) return;
    this.element.dispatchEvent(
      new CustomEvent('formChange', {
        bubbles: true,
        detail: { resource },
      }),
    );

    if (!eventOptions.value) return;
    this.element.dispatchEvent(
      new CustomEvent('filterChange', {
        bubbles: true,
        detail: {
          value: eventOptions.value,
          inputLabel: eventOptions.inputLabel,
          type: eventOptions.type
        }
      }),
    );
  },
  async inputChange(input: EventTarget): Promise<void> {
    // FIXME: Improve this as we need to support more than input and single select.
    // What about multiple select, checkboxes, radio buttons, etc?
    let parentElementLabel = (input as HTMLInputElement)?.parentElement?.getAttribute('label');
    try {
      const selectedLabel = (input as HTMLSelectElement).selectedOptions[0].textContent?.trim();
      this.change(
        this.value,
        {
          value: selectedLabel,
          inputLabel: parentElementLabel,
          type: 'select'
        }
      );
    } catch {
      this.change(this.value,
        {
          value: (input as HTMLInputElement).value,
          inputLabel: parentElementLabel,
          type: 'input'
        }
      );
    }
  },
  getSubmitTemplate() {
    return html`
      <div class=${ifDefined(this.classSubmitButton)}>
        ${this.submitWidget === 'button' ? html`
          <button type="submit">${this.submitButton || ''}</button>
        ` : html`
          <input type="submit" value=${ifDefined(this.submitButton || undefined)}>
        `}
      </div>
    ` 
  },
  empty(): void {},
  debounceInput(input: EventTarget | null) {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.debounceTimeout = undefined;
      this.inputChange(input);
    }, this.debounce);
  },
  async populate(): Promise<void> {
    await this.replaceAttributesData();
    if(this.submitButton == null) {
      this.element.addEventListener('input', (e: Event) => this.debounceInput(e.target));
    } else {
      this.element.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        this.inputChange(e.target);
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