import { Sib } from '../libs/Sib';
import { spread, preHTML } from '../libs/lit-helpers';

import { WidgetMixin } from '../mixins/widgetMixin';
import { AttributeBinderMixin } from '../mixins/attributeBinderMixin';
import { ContextMixin } from '../mixins/contextMixin';
// import type { WidgetInterface } from '../mixins/interfaces';
import { newWidgetFactory } from '../new-widgets/new-widget-factory';

import { html, render } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';
// import { uniqID } from '../libs/helpers';
// import type { SearchQuery } from '../libs/interfaces';

export const SolidTraversalSearch = {
    name: 'solid-traversal-search',
    use: [WidgetMixin, AttributeBinderMixin, ContextMixin],
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
    async inputChange(): Promise<void> {
      this.change(this.value);
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
    async attach(elm: any) {
      if(this.attachedElements.has(elm)) return;
      this.attachedElements.add(elm);
    },
    async detach(elm: any) {
      if(!this.attachedElements.has(elm)) return;
      this.attachedElements.delete(elm);
    },
    empty(): void { },
    async populate(): Promise<void> {
        if (this.submitButton == null) {
            this.element.addEventListener('input', () => this.inputChange());
        } else {
            this.element.addEventListener('submit', (e: Event) => {
                e.preventDefault();
                this.inputChange();
            });
        }
        const fields = await this.getFields();
        console.log("Fields list from traversal search", fields);
        const widgetTemplates = await Promise.all(fields.map((field: string) => {
            let attributes = this.widgetAttributes(field, this.resource);
            console.log("Attributes for field", field, this.resource, attributes);
            return preHTML`<${'input'} type="text" ...=${spread(attributes)}></${'input'}>`;
        }));
        const template = html`
        <form>
            ${widgetTemplates}
            ${this.submitButton == null ? '' : this.getSubmitTemplate()}
        </form>
        `;
        render(template, this.element);
    }
};
Sib.register(SolidTraversalSearch);