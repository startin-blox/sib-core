import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { setDeepProperty } from '../libs/helpers.js';

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
  },
  get defaultSetWidget(): string {
    return 'solid-set-default';
  },
  get value(): object {
    const values = {};
    this.widgets.forEach(({name, value}) => {
      try {
        value = JSON.parse(value);
      } catch (e) {}
      setDeepProperty(values, name.split('.'), value);
    });

    return values;
  },
  set value(value) {
    this.widgets.forEach(el => {
      try {
        if(value[el.name]) el.value = value[el.name]
      } catch (e) {}
    });
  },
  async getFormValue() {
    let value = this.value;
    if (this.resource && !(await this.resource.isContainer())) value['@id'] = this.resourceId;
    return value
  },

  getWidget(field:string):string {
    const widget = this._getWidget(field)
    if(!this.element.localName.startsWith('sib-')) 
      return widget;
    return widget.replace(/^solid-/, 'sib-');
  },
  _getWidget(field: string): string {
    if (!this.element.hasAttribute('widget-' + field)
      && this.element.hasAttribute('range-' + field)) {
      return 'solid-form-dropdown';
    } else {
      const widget = this.element.getAttribute('widget-' + field); // TODO : duplicated code
      if (widget) {
        if (!customElements.get(widget)) {
          console.warn(`The widget ${widget} is not defined`);
        }
        return widget;
      }
      return this.defaultWidget;
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
    this.change(await this.getFormValue());
  },
  createInput(type: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = type;
    return input;
  },
  empty(): void {
    if (!this.element) return;
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
      }
  },
  reset() {
    this.element.querySelectorAll('select[multiple]').forEach((select: HTMLSelectElement) => { // reset multiple select
      const options = select.querySelectorAll('option:checked') as NodeListOf<HTMLOptionElement>;
      options.forEach(option => option.selected = false );
      select.dispatchEvent(new Event('change'));
    })
  },
  async populate(): Promise<void> {
    this.element.addEventListener('input', (event: Event) => this.inputChange(event));

    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
    for (const field of await this.getFields()) {
      this.element.appendChild(this.createWidget(field));
    }
    if (this.isNaked) return;
  }
};

Sib.register(SolidFormSearch);