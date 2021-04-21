import { Sib } from '../libs/Sib';
import { WidgetMixin } from '../mixins/widgetMixin';
import { AttributeBinderMixin } from '../mixins/attributeBinderMixin';
import type { WidgetInterface } from '../mixins/interfaces';
import { newWidgetFactory } from '../new-widgets/new-widget-factory';

import { html, render } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';
import { uniqID } from '../libs/helpers';

export const SolidFormSearch = {
  name: 'solid-form-search',
  use: [WidgetMixin, AttributeBinderMixin],
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
    const idField = this.rangeId.concat('_', field);
    // If auto-range-[field] exists, create range-[field] and sets its value
    if(this.element.hasAttribute('auto-range-' + field) && !this.element.hasAttribute('range-' + field)) {
      this.element.setAttribute('range-' + field, 'store://local.' + idField);
      this.populate();
    }
    
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
      if(!attr['name'].startsWith('auto-range-')) continue;
      const field = attr['name'].replace('auto-range-', '');
      const autoRangeValues = new Set();
      for(const elm of this.attachedElements) {
        for(const value of await elm.getValuesOfField(field)) {
          autoRangeValues.add(value);
        }
      }
      const idField = `${this.rangeId}_${field}`;
      const id = `store://local.${idField}`;
      const ldpContains = Array.from(autoRangeValues).map(id => ({'@id' : id}));
      const data = {
        "@type": "ldp:Container",
        "ldp:contains" : ldpContains,
      };
      sibStore.setLocalData(data, id);
    }
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
  async populate(): Promise<void> {
    await this.getAttributesData();
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