import { Sib } from '../libs/Sib';
import { BaseWidgetMixin } from '../new-widgets/baseWidgetMixin';
import { evalTemplateString } from '../libs/helpers';

//@ts-ignore
import { html, render } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { unsafeHTML } from 'https://unpkg.com/lit-html/directives/unsafe-html?module';


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
    if (!this.name) return;
    const template = this.template;
    const newWidget = {
      name: this.name,
      use: [
        BaseWidgetMixin,
      ],
      get template() {
        return () => this.evalTemplate(template).then((tpl: string) => html`${unsafeHTML(tpl)}`)
      },
      evalTemplate(template: string) {
        const tpl =  evalTemplateString(template, {
          name: this.name,
          value: this.value || '',
          // TODO : add all needed attributes
        });
        return tpl;
      },
      async templateToDOM(template) {
        render(await template, this.element);
      }
    };

    Sib.register(newWidget); // and register component
  },
  get template() {
    return this.element.querySelector('template:not([data-range])').innerHTML;
  },
  get childTemplate(): string | null {
    const child = this.element.querySelector('template[data-range]');
    return child ? child.innerHTML : null;
  }
};

Sib.register(SolidWidget);