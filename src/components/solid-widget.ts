import { html, render } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Sib } from '../libs/Sib.ts';
import { evalTemplateString } from '../libs/helpers.ts';
import { StoreMixin } from '../mixins/storeMixin.ts';
import { ActionMixin } from '../new-widgets/attributeMixins/actionMixin.ts';
import { BaseWidgetMixin } from '../new-widgets/baseWidgetMixin.ts';
import { FormMixin } from '../new-widgets/templatesDependencies/formMixin.ts';

export const SolidWidget = {
  name: 'solid-widget',
  use: [],
  attributes: {
    name: {
      type: String,
      default: '',
      required: true,
    },
  },
  attached(): void {
    if (!this.name) return;
    const template = this.template;
    const newWidget = {
      name: this.name,
      class: this.template,
      use: [BaseWidgetMixin, StoreMixin, FormMixin, ActionMixin],
      attributes: {
        label: {
          type: String,
          default: '',
          callback: function (newValue: string) {
            this.addToAttributes(newValue, 'label');
          },
        },
      },
      get template() {
        return () =>
          this.evalTemplate(template).then(
            (tpl: string) => html`${unsafeHTML(tpl)}`,
          );
      },
      evalTemplate(template: string) {
        const tpl = evalTemplateString(template, {
          name: this.name,
          value: this.value || this.resource || '',
          src: this.src,
          label: this.label,
          targetSrc: this.targetSrc || '',
        });
        return tpl;
      },
      async templateToDOM(template) {
        render(await template, this.element);
      },
      // For form widgets, handle nested solid-form
      // TODO: type custom elements
      getValueFromElement(element: any) {
        if (element.tagName === 'SOLID-FORM') return element.component.value; // nested solid-form
        if (element.component) return element.component.getValue(); // form widget
        return element.value; // input
      },
      updateDOM() {
        // override StoreMixin method to launch render when resource fetched
        this.planRender();
      },
    };

    Sib.register(newWidget); // and register component
  },
  get template() {
    return this.element.querySelector('template:not([data-range])').innerHTML;
  },
  get childTemplate(): string | null {
    const child = this.element.querySelector('template[data-range]');
    return child ? child.innerHTML : null;
  },
};

Sib.register(SolidWidget);
