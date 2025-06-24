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
        console.log('------solidwidget------get template', template);

        return () =>
          this.evalTemplate(template).then(
            (tpl: string) => html`${unsafeHTML(tpl)}`,
          );
      },
      evalTemplate(template: string) {
        console.log('----solidwidget--------evalTemplate', template);
        const tpl = evalTemplateString(template, {
          name: this.name,
          value: this.value || this.resource || '',
          src: this.src,
          label: this.label,
          targetSrc: this.targetSrc || '',
        });

        console.log(
          '----solidwidget--------evalTemplate tpl',
          tpl,
          this.value,
          this.resource,
        );
        return tpl;
      },
      async templateToDOM(template) {
        console.log(
          '----solidwidget--------templateToDOM',
          await template,
          this.element,
        );
        render(await template, this.element);
      },
      // For form widgets, handle nested solid-form
      // TODO: type custom elements
      getValueFromElement(element: any) {
        console.log('------solidwidget------getValueFromElement', template);
        if (element.tagName === 'SOLID-FORM') return element.component.value; // nested solid-form
        if (element.component) return element.component.getValue(); // form widget
        return element.value; // input
      },
      updateDOM() {
        console.log('-----solidwidget-------updateDOM', template);
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
