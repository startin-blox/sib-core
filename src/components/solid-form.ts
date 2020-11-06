import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { NextMixin } from '../mixins/nextMixin.js';
import { store } from '../libs/store/store.js';
import { setDeepProperty } from '../libs/helpers.js';
import type { WidgetInterface } from '../mixins/interfaces.js';

//@ts-ignore
import { html, render } from 'https://unpkg.com/lit-html?module';
//@ts-ignore
import { ifDefined } from 'https://unpkg.com/lit-html/directives/if-defined?module';

export const SolidForm = {
  name: 'solid-form',
  use: [WidgetMixin, StoreMixin, NextMixin],
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
      default: undefined,
      callback: function (newValue: string, oldValue: string) {
        if (newValue !== oldValue) this.populate();
      },
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
      const name = (widget.component || widget).name;
      if (name == null) return;
      let value = widget.component ? widget.component.getValue() : widget.value;
      try {
        value = JSON.parse(value);
      } catch (e) {}
      setDeepProperty(values, name.split('.'), value);
    });
    return values;
  },
  get isNaked(): boolean {
    return this.element.hasAttribute('naked');
  },
  async getFormValue() {
    let value = this.value;
    if (this.resource && !this.resource.isContainer()) { // add @id if edition
      value['@id'] = this.resourceId;

      for (let predicate of Object.keys(this.value)) { // add @id for nested resources
        const object = await this.resource[predicate];
        if (object && object['@id']) value[predicate]['@id'] = object['@id'];
      }
    }
    return value;
  },
  getWidget(field: string, isSet: boolean = false): WidgetInterface {
    let tagName = '';
    const widgetAttribute = this.element.getAttribute('widget-' + field);

    // Choose widget
    if (!widgetAttribute && this.element.hasAttribute('upload-url-' + field)) {
      tagName = 'solid-form-file'
    } else if (!widgetAttribute && this.element.hasAttribute('range-' + field)) {
      tagName = 'solid-form-dropdown'
    } else {
      tagName = widgetAttribute || (!isSet ? this.defaultWidget : this.defaultSetWidget);
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
        e.json().then( error => this.showError(error) );
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
    } catch (e) { return; }
    if (isCreation) this.reset(); // we reset the form only in creation mode

    this.goToNext({'@id': id})
  },
  async inputChange(): Promise<void> {
    this.change(await this.getFormValue());
  },
  empty(): void {
  },
  showError(e: object) {
    const errorTemplate = html`
      <p>A validation error occured.</p>
      <ul>
        ${Object.keys(e).filter(field => !field.startsWith('@')).map(field => html`
          <li>${field}: ${e[field]}</li>
        `)}
      </ul>
    `;
    // If field exists pick its label (unsure if that's easily possible)
    // In this.getFields() map with each field and get label
    // If it does not just add a notice as we do that it's missing that field

    // Validation message in english ?
    const parentElement = this.element.querySelector('[data-id=error]');
    if (parentElement) render(errorTemplate, parentElement);
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
    const fieldsTemplate = html`
      ${fields.map((field: string) => this.createWidget(field))}
    `;
    const template = html`
      <div data-id="error"></div>
      ${!this.isNaked ? html`
        <form
          @submit=${this.onSubmit.bind(this)}
          @reset=${this.onReset.bind(this)}
        >
          ${fieldsTemplate}
          <input type="submit" value=${ifDefined(this.submitButton)}>
          ${this.element.hasAttribute('reset')
            ? html`<input type="reset" />` : ''}
        </form>
      ` : html`
        ${fieldsTemplate}
      `
      }
    `;
    render(template, this.element);
  }
};

Sib.register(SolidForm);