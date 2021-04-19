import { Sib } from '../libs/Sib';
import { WidgetMixin } from '../mixins/widgetMixin';
import { StoreMixin } from '../mixins/storeMixin';
import { NextMixin } from '../mixins/nextMixin';
import { ValidationMixin } from '../mixins/validationMixin';
import { store } from '../libs/store/store';
import { setDeepProperty } from '../libs/helpers';
import type { WidgetInterface } from '../mixins/interfaces';

import { html, render } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';

export const SolidForm = {
  name: 'solid-form',
  use: [WidgetMixin, StoreMixin, NextMixin, ValidationMixin],
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
        if (this.noRender == null && newValue !== oldValue) this.populate();
      },
    },
    submitWidget: {
      type: String,
      default: null
    },
    classSubmitButton: {
      type: String,
      default: undefined,
    },
    partial: {
      type: Boolean,
      default: null
    },
    autosave: {
      type: Boolean,
      default: null
    },
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
    // add @id if edition
    if (this.resource && !this.resource.isContainer()) values['@id'] = this.resourceId;
    return values;
  },
  get isNaked(): boolean {
    return this.element.hasAttribute('naked');
  },
  get isSavingAutomatically(): boolean {
    return this.autosave !== null;
  },
  isCreationForm(formValue: object): boolean {
    return !('@id' in formValue);
  },
  async getFormValue() {
    let value = this.value;
    if (this.resource && !this.resource.isContainer()) {
      for (let predicate of Object.keys(this.value)) { // add @id for nested resources
        const object = await this.resource[predicate];
        if (object && object['@id'] && !value[predicate]['@id']) value[predicate]['@id'] = object['@id'];
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
    } else if (!widgetAttribute && (this.element.hasAttribute('range-' + field) || this.element.hasAttribute('enum-' + field))) {
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
        e.json().then(error => this.showError(error));
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
    let id: string;
    try {
      id = await this.save() || this.getFormValue()['@id'];
    } catch (e) { return; }
    this.reset();
    this.goToNext({'@id': id})
  },
  async onInput(): Promise<void> {
    const formValue = await this.getFormValue();
    this.change(formValue);
  },
  async onChange(): Promise<void> {
    const formValue = await this.getFormValue();
    if (!this.isCreationForm(formValue) && this.isSavingAutomatically)
      this.submitForm(); // if autosave, submitForm
  },
  findErrorMessage(errors: [string, any][], errorFullName: string = '') {
    let errorsArray: string[] = [];
    errors.forEach((member: [string, any]) => {
      let errorNextName: string = Object.values(member)[0];
      let errorAddName = (errorFullName === "" ? errorNextName : errorFullName.concat(' - ', errorNextName));
      if (Array.isArray(Object.values(member)[1]) === true) {
        let errorMessage: string[] = Object.values(member)[1];
        let errorGlobal = errorAddName.concat(': ', errorMessage.join(', '));
        errorsArray.push(errorGlobal);
      } else {
        let objectErrors = Object.values(member)[1];
        let subErrors = Object.entries(objectErrors);
        errorsArray = [...errorsArray, ...this.findErrorMessage(subErrors, errorAddName)];
      }
    });
    return errorsArray;
  },
  empty(): void {},
  showError(e: object) {
    let errors = Object.entries(e).filter(field => !field[0].startsWith('@context'));

    const errorTemplate = html`
      <p>A validation error occured.</p>
      <ul>
        ${this.findErrorMessage(errors).map(field => html`
         <li>${field}</li>
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
    const parentElement = this.element.querySelector('[data-id=error]');
    if (parentElement) render('', parentElement);
  },
  reset() {
    if (!this.isNaked) this.element.querySelector('form').reset();
  },
  onSubmit(event: Event) {
    if (!this.isNaked) {
      event.preventDefault();
      this.performAction(); // In validationMixin, method defining what to do according to the present attributes
    }
  },
  validateModal() { //send method to validationMixin, used by the dialog modal and performAction method
    return this.submitForm();
  },
  onReset() {
    if (!this.isNaked) setTimeout(() => this.onInput())
  },
  getSubmitTemplate() {
    return html`
      <div class=${ifDefined(this.classSubmitButton)}>
        ${this.submitWidget === 'button' ? html`
          <button type="submit">${this.submitButton || this.t("solid-form.submit-button")}</button>
        ` : html`
          <input type="submit" value=${this.submitButton || this.t("solid-form.submit-button")}>
        `}
      </div>
    `
  },
  async populate(): Promise<void> {
    this.element.oninput = () => this.onInput(); // prevent from firing change multiple times
    this.element.onchange = () => this.onChange();
    const fields = await this.getFields();
    const widgetTemplates = await Promise.all(fields.map((field: string) => this.createWidgetTemplate(field)));
    const template = html`
      <div data-id="error"></div>
      ${!this.isNaked ? html`
        <form
          @submit=${this.onSubmit.bind(this)}
          @reset=${this.onReset.bind(this)}
        >
          ${widgetTemplates}
          ${!this.isSavingAutomatically ? this.getSubmitTemplate() : ''}
          ${this.element.hasAttribute('reset')
            ? html`<input type="reset" />` : ''}
        </form>
      ` : html`
        ${widgetTemplates}
      `
      }
      ${this.getModalDialog()}
    `;
    render(template, this.element);
  }
};

Sib.register(SolidForm);