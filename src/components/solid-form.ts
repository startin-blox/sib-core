import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { store } from '../libs/store/store.js';
import { setDeepProperty } from '../libs/helpers.js';
import { WidgetInterface } from '../mixins/interfaces.js';

//@ts-ignore
import { html, render } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { ifDefined } from 'https://unpkg.com/lit-html/directives/if-defined?module';

export const SolidForm = {
  name: 'solid-form',
  use: [WidgetMixin, StoreMixin],
  attributes: {
    defaultWidget: {
      type: String,
      default: 'solid-form-label-text'
    },
    naked: {
      type: String,
      default: null
    },
    submitButton: {
      type: String,
      default: undefined
    },
    partial: {
      type: Boolean,
      default: null
    }
  },
  initialState: {
    error: ''
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
      let value = widget.component ? widget.component.getValue() : widget.value;
      try {
        value = JSON.parse(value);
      } catch (e) {}
      setDeepProperty(values, widget.component.name.split('.'), value);
    });
    return values;
  },
  set value(value) { // TODO : does not work anymore
    this.widgets.forEach(el => {
      try {
        if(value[el.name]) el.value = value[el.name]
      } catch (e) {}
    });
  },
  get isNaked(): boolean {
    return this.element.hasAttribute('naked');
  },
  async getFormValue() {
    let value = this.value;
    if (this.resource && !(await this.resource.isContainer())) { // add @id if edition
      value['@id'] = this.resourceId;
    }
    return value;
  },
  getWidget(field: string): WidgetInterface {
    let tagName = '';
    const widgetAttribute = this.element.getAttribute('widget-' + field);

    // Choose widget
    if (!widgetAttribute && this.element.hasAttribute('upload-url-' + field)) {
      tagName = 'solid-form-file'
    } else if (!widgetAttribute && this.element.hasAttribute('range-' + field)) {
      tagName = 'solid-form-dropdown'
    } else {
      tagName = widgetAttribute || this.defaultWidget;
    }
    // Create widget
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
  async save(): Promise<object> {
    this.toggleLoaderHidden(false);
    this.hideError();
    const resource = await this.getFormValue();
    resource['@context'] = this.context;
    let saved;
    try {
      if (this.partial == null) {
      saved = resource['@id'] ?
        await store.put(resource, this.resourceId) :
        await store.post(resource, this.resourceId);
      } else {
        saved = await store.patch(resource, this.resourceId);
      }
    } catch (e) {
      this.toggleLoaderHidden(true);
      if (e) { // if server error
        this.showError(e);
        throw e;
      } // else, ldpframework error, we continue
    }
    this.element.dispatchEvent(
      new CustomEvent('save', {
        bubbles: true,
        detail: {
          resource: resource,
          id: saved || null
        },
      }),
    );
    this.toggleLoaderHidden(true);
    return saved;
  },
  async submitForm(): Promise<void> {
    const isCreation = !('@id' in (await this.getFormValue()));
    let id;
    try {
      id = await this.save() || this.getFormValue()['@id'];
    } catch (e) { return }
    if (isCreation) this.reset(); // we reset the form only in creation mode
    if (!this.next) return;
    this.element.dispatchEvent(
      new CustomEvent('requestNavigation', {
        bubbles: true,
        detail: { route: this.next, resource: {'@id': id} },
      }),
    );
  },
  async inputChange(): Promise<void> {
    this.change(await this.getFormValue());
  },
  empty(): void {
  },
  showError(e: object) {
    this.error = html`
      <div data-id="error">
        <p>${e}</p>
      </div>
    `;
    this.populate();
  },
  hideError() {
    const error = this.element.querySelector('[data-id=form-error]');
    if (error) this.element.removeChild(error);
  },
  reset() {
    if (!this.isNaked) this.element.querySelector('form').reset();
    this.element.querySelectorAll('select[multiple]').forEach((select: HTMLSelectElement) => { // reset multiple select
      const options = select.querySelectorAll('option:checked') as NodeListOf<HTMLOptionElement>;
      options.forEach(option => option.selected = false );
      select.dispatchEvent(new Event('change'));
    })
  },
  onSubmit(event: Event) {
    if (!this.isNaked) {
      event.preventDefault();
      this.submitForm();
    }
  },
  onReset(event: Event) {
    if (!this.isNaked) {
      setTimeout(() => this.inputChange(event))
    }
  },
  async populate(): Promise<void> {
    this.element.addEventListener('input', (event: Event) => this.inputChange(event));
    const fields = await this.getFields();
    const template = html`
      ${this.error}
      <form
        @submit=${this.onSubmit.bind(this)}
        @reset=${this.onReset.bind(this)}
      >
        ${fields.map((field: string) => this.createWidget(field))}
        ${!this.isNaked
          ? html`<input type="submit" value=${ifDefined(this.submitButton)}>` : ''}
        ${!this.isNaked && this.element.hasAttribute('reset')
          ? html`<input type="reset" />` : ''}
      </form>
    `;
    render(template, this.element);
  }
};

Sib.register(SolidForm);